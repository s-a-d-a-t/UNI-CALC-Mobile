const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const db = require('./db');
const {
  validateRequestBody,
  loginSchema,
  registerSchema,
  profileSchema,
  semestersSchema,
  assignmentsSchema,
  studyLogsSchema,
} = require('./validation');

// Read backend/.env or root .env
if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} else {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'unicalc-jwt-secret-key-2026';

// Rate limiting middleware for auth routes
const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // generous limit for development & mobile testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = req.rateLimit.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 60;
    res.status(429).json({
      error: `Too many attempts. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    });
  },
});

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.set('trust proxy', 1);
}

// Support cross-origin requests from web desktop, mobile apps, and local dev
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps (no origin), localhost, and client origin
      if (!origin || origin === CLIENT_ORIGIN || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'unicalc-dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Dual authentication middleware: checks JWT Bearer token (Mobile) or Session cookie (Web Desktop)
function requireAuth(req, res, next) {
  // 1. Check Bearer Token (Mobile)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userEmail = decoded.email;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }
  }

  // 2. Check Session Cookie (Web Desktop)
  if (req.session && req.session.email) {
    req.userEmail = req.session.email;
    return next();
  }

  return res.status(401).json({ error: 'Not authenticated' });
}

function generateToken(email) {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
}

// Health Check
app.get('/api/health', async (_req, res) => {
  try {
    await db.pool.query('SELECT 1');
    res.json({ ok: true, server: 'UNI-CALC API', database: 'connected' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Current User Session
app.get('/api/auth/session', async (req, res) => {
  try {
    let email = null;

    // Check Bearer token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
        email = decoded.email;
      } catch (e) {}
    }

    // Fall back to session cookie
    if (!email && req.session && req.session.email) {
      email = req.session.email;
    }

    if (!email) {
      return res.json({ user: null });
    }

    const profile = await db.getProfile(email);
    res.json({ user: { email, ...profile } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (Supports Bcrypt & sets both Session Cookie for Web and JWT for Mobile)
app.post('/api/auth/login', authRateLimiter, validateRequestBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);
    const user = await db.loginUser(email, password);

    // 1. Set session cookie for Desktop Web
    req.session.email = user.email;

    // 2. Generate JWT for Mobile
    const token = generateToken(user.email);

    console.log(`[AUTH] Login successful for: ${email}`);
    res.json({ user, token });
  } catch (err) {
    console.error(`[AUTH] Login failed for ${req.body?.email}:`, err.message);
    res.status(401).json({ error: err.message });
  }
});

// Register (Uses Bcrypt & sets both Session Cookie for Web and JWT for Mobile)
app.post('/api/auth/register', authRateLimiter, validateRequestBody(registerSchema), async (req, res) => {
  try {
    const user = await db.registerUser(req.body);

    req.session.email = user.email;
    const token = generateToken(user.email);

    res.json({ user, token });
  } catch (err) {
    console.error(`[AUTH] Register failed:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// Profile Endpoints
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const profile = await db.getProfile(req.userEmail);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', requireAuth, validateRequestBody(profileSchema), async (req, res) => {
  try {
    const profile = await db.updateProfile(req.userEmail, req.body);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Semesters & Courses Endpoints
app.get('/api/semesters', requireAuth, async (req, res) => {
  try {
    const semesters = await db.getSemesters(req.userEmail);
    res.json({ semesters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/semesters', requireAuth, validateRequestBody(semestersSchema), async (req, res) => {
  try {
    const semesters = await db.saveSemesters(req.userEmail, req.body.semesters);
    res.json({ semesters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assignments Endpoints
app.get('/api/assignments', requireAuth, async (req, res) => {
  try {
    const assignments = await db.getAssignments(req.userEmail);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assignments', requireAuth, validateRequestBody(assignmentsSchema), async (req, res) => {
  try {
    const assignments = await db.saveAssignments(req.userEmail, req.body.assignments);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Study Logs Endpoints
app.get('/api/study-logs', requireAuth, async (req, res) => {
  try {
    const studyLogs = await db.getStudyLogs(req.userEmail);
    res.json({ studyLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/study-logs', requireAuth, validateRequestBody(studyLogsSchema), async (req, res) => {
  try {
    const studyLogs = await db.saveStudyLogs(req.userEmail, req.body.studyLogs);
    res.json({ studyLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  try {
    await db.ensureFeatureSchema();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`UNI-CALC Backend active and listening on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database schema:', err.message);
    process.exit(1);
  }
}

startServer();
