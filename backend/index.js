const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const db = require('./db');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'unicalc-jwt-secret-key-2026';

// Allow desktop web origin with credentials, and permit mobile app requests
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || origin === CLIENT_ORIGIN || origin.includes('localhost')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Session support for Desktop Web Browsers
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'unicalc-dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

/**
 * Dual Authentication Middleware:
 * 1. Checks for Authorization: Bearer <JWT> (used by Mobile App)
 * 2. Checks for req.session.email (used by Desktop Web Browser)
 */
function requireAuth(req, res, next) {
  // Check Bearer Token (Mobile)
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

  // Check Session Cookie (Desktop Web)
  if (req.session && req.session.email) {
    req.userEmail = req.session.email;
    return next();
  }

  return res.status(401).json({ error: 'Not authenticated' });
}

// Generate JWT token helper
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

// Check Session / Current User
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

// Login (Supports both Desktop Cookie + Mobile JWT)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.loginUser(email, password);

    // 1. Set session cookie for Desktop Web
    req.session.email = user.email;

    // 2. Generate JWT for Mobile
    const token = generateToken(user.email);

    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Register (Supports both Desktop Cookie + Mobile JWT)
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await db.registerUser(req.body);

    // 1. Set session cookie for Desktop Web
    req.session.email = user.email;

    // 2. Generate JWT for Mobile
    const token = generateToken(user.email);

    res.json({ user, token });
  } catch (err) {
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

// Academic Profile
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const profile = await db.getProfile(req.userEmail);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const profile = await db.updateProfile(req.userEmail, req.body);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Semesters & Courses
app.get('/api/semesters', requireAuth, async (req, res) => {
  try {
    const semesters = await db.getSemesters(req.userEmail);
    res.json({ semesters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/semesters', requireAuth, async (req, res) => {
  try {
    const semesters = await db.saveSemesters(req.userEmail, req.body.semesters);
    res.json({ semesters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assignments
app.get('/api/assignments', requireAuth, async (req, res) => {
  try {
    const assignments = await db.getAssignments(req.userEmail);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assignments', requireAuth, async (req, res) => {
  try {
    const assignments = await db.saveAssignments(req.userEmail, req.body.assignments);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Study Logs
app.get('/api/study-logs', requireAuth, async (req, res) => {
  try {
    const studyLogs = await db.getStudyLogs(req.userEmail);
    res.json({ studyLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/study-logs', requireAuth, async (req, res) => {
  try {
    const studyLogs = await db.saveStudyLogs(req.userEmail, req.body.studyLogs);
    res.json({ studyLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UNI-CALC Dual API listening on http://0.0.0.0:${PORT}`);
});
