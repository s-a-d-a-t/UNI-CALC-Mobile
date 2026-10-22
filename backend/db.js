const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Neon cloud PostgreSQL
      },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'unicalc',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

const DEFAULT_SEMESTERS = [
  {
    id: 'sem-default-1',
    description: 'Year 1, Semester I',
    number: 1,
    courses: [
      { id: 'course-1', name: 'Introduction to Calculus', credits: 4, grade: '4.00', category: 'core', status: 'passed' },
      { id: 'course-2', name: 'General Physics', credits: 3, grade: '3.50', category: 'core', status: 'passed' },
      { id: 'course-3', name: 'Communicative English Skills', credits: 3, grade: '3.00', category: 'general', status: 'passed' },
    ],
  },
];

function mapProfile(row) {
  if (!row) return null;
  return {
    name: row.name || '',
    studentId: row.student_id || '',
    major: row.major || '',
    targetCgpa: row.target_cgpa != null ? Number(row.target_cgpa) : 3.5,
    graduationCredits: row.graduation_credits != null ? Number(row.graduation_credits) : 145,
    coreCreditsRequired: row.core_credits_required != null ? Number(row.core_credits_required) : 100,
    electiveCreditsRequired: row.elective_credits_required != null ? Number(row.elective_credits_required) : 45,
  };
}

function groupSemesterRows(rows) {
  const byClientId = new Map();
  for (const row of rows) {
    if (!byClientId.has(row.semester_id)) {
      byClientId.set(row.semester_id, {
        id: row.semester_id,
        description: row.description || '',
        number: row.semester_number ?? 0,
        courses: [],
      });
    }
    if (row.course_client_id) {
      byClientId.get(row.semester_id).courses.push({
        id: row.course_client_id,
        name: row.course_name || '',
        credits: row.credits ?? 0,
        grade: row.grade || '4.00',
        category: row.category || 'core',
        status: row.status || 'passed',
        isRetake: row.is_retake ?? false,
      });
    }
  }
  return [...byClientId.values()].sort((a, b) => a.number - b.number);
}

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function getProfileRow(email) {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
  return rows[0] || null;
}

async function loginUser(email, password) {
  const formattedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(formattedEmail);
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }
  const profile = mapProfile(await getProfileRow(formattedEmail));
  return { email: formattedEmail, ...profile };
}

async function registerUser({ name, email, password, major, studentId }) {
  const formattedEmail = email.toLowerCase().trim();
  if (await findUserByEmail(formattedEmail)) {
    throw new Error('Email is already registered');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO users (email, password, name, major, student_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [formattedEmail, password, name, major || null, studentId || null]
    );
    await client.query(
      `INSERT INTO profiles (email, name, student_id, major, target_cgpa, graduation_credits)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [formattedEmail, name, studentId || '', major || '', 3.5, 145]
    );

    for (const sem of DEFAULT_SEMESTERS) {
      const { rows } = await client.query(
        `INSERT INTO semesters (email, semester_id, description, semester_number)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [formattedEmail, sem.id, sem.description, sem.number]
      );
      const semesterDbId = rows[0].id;
      for (const course of sem.courses) {
        await client.query(
          `INSERT INTO courses (semester_id, course_client_id, name, credits, grade, category, status, is_retake)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            semesterDbId,
            course.id,
            course.name,
            course.credits,
            course.grade,
            course.category || 'core',
            course.status || 'passed',
            course.isRetake ?? false,
          ]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { email: formattedEmail, ...(await getProfile(formattedEmail)) };
}

async function getProfile(email) {
  const row = await getProfileRow(email);
  if (!row) throw new Error('Profile not found');
  return mapProfile(row);
}

async function updateProfile(email, profileData) {
  const { rows } = await pool.query(
    `INSERT INTO profiles (email, name, student_id, major, target_cgpa, graduation_credits, core_credits_required, elective_credits_required)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       student_id = EXCLUDED.student_id,
       major = EXCLUDED.major,
       target_cgpa = EXCLUDED.target_cgpa,
       graduation_credits = EXCLUDED.graduation_credits,
       core_credits_required = EXCLUDED.core_credits_required,
       elective_credits_required = EXCLUDED.elective_credits_required
     RETURNING *`,
    [
      email,
      profileData.name || '',
      profileData.studentId || '',
      profileData.major || '',
      profileData.targetCgpa != null ? Number(profileData.targetCgpa) : 3.5,
      profileData.graduationCredits != null ? Number(profileData.graduationCredits) : 145,
      profileData.coreCreditsRequired != null ? Number(profileData.coreCreditsRequired) : 100,
      profileData.electiveCreditsRequired != null ? Number(profileData.electiveCreditsRequired) : 45,
    ]
  );
  return mapProfile(rows[0]);
}

async function getSemesters(email) {
  const { rows } = await pool.query(
    `SELECT s.semester_id, s.description, s.semester_number,
            c.course_client_id, c.name AS course_name, c.credits, c.grade,
            c.category, c.status, c.is_retake
     FROM semesters s
     LEFT JOIN courses c ON c.semester_id = s.id
     WHERE s.email = $1
     ORDER BY s.semester_number, c.id`,
    [email]
  );

  if (rows.length === 0) {
    await saveSemesters(email, JSON.parse(JSON.stringify(DEFAULT_SEMESTERS)));
    return getSemesters(email);
  }

  return groupSemesterRows(rows);
}

async function saveSemesters(email, semesters) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM semesters WHERE email = $1', [email]);

    for (const sem of semesters) {
      const { rows } = await client.query(
        `INSERT INTO semesters (email, semester_id, description, semester_number)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [email, sem.id, sem.description || '', sem.number ?? 0]
      );
      const semesterDbId = rows[0].id;
      for (const course of sem.courses || []) {
        await client.query(
          `INSERT INTO courses (semester_id, course_client_id, name, credits, grade, category, status, is_retake)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            semesterDbId,
            course.id,
            course.name || '',
            course.credits ?? 0,
            course.grade || '4.00',
            course.category || 'core',
            course.status || 'passed',
            course.isRetake ?? false,
          ]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return semesters;
}

function mapAssignment(row) {
  return {
    id: row.client_id,
    title: row.title || '',
    courseName: row.course_name || '',
    type: row.type || 'assignment',
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
    completed: row.completed ?? false,
    notes: row.notes || '',
  };
}

function mapStudyLog(row) {
  return {
    id: row.client_id,
    courseName: row.course_name || '',
    hours: row.hours != null ? Number(row.hours) : 0,
    logDate: row.log_date ? row.log_date.toISOString().slice(0, 10) : '',
    notes: row.notes || '',
  };
}

async function getAssignments(email) {
  const { rows } = await pool.query(
    `SELECT client_id, title, course_name, type, due_date, completed, notes
     FROM assignments WHERE email = $1 ORDER BY due_date NULLS LAST, id`,
    [email]
  );
  return rows.map(mapAssignment);
}

async function saveAssignments(email, assignments) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM assignments WHERE email = $1', [email]);
    for (const item of assignments || []) {
      await client.query(
        `INSERT INTO assignments (email, client_id, title, course_name, type, due_date, completed, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          email,
          item.id,
          item.title || '',
          item.courseName || '',
          item.type || 'assignment',
          item.dueDate || null,
          item.completed ?? false,
          item.notes || '',
        ]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return assignments;
}

async function getStudyLogs(email) {
  const { rows } = await pool.query(
    `SELECT client_id, course_name, hours, log_date, notes
     FROM study_logs WHERE email = $1 ORDER BY log_date DESC, id`,
    [email]
  );
  return rows.map(mapStudyLog);
}

async function saveStudyLogs(email, studyLogs) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM study_logs WHERE email = $1', [email]);
    for (const item of studyLogs || []) {
      await client.query(
        `INSERT INTO study_logs (email, client_id, course_name, hours, log_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          email,
          item.id,
          item.courseName || '',
          item.hours ?? 0,
          item.logDate || new Date().toISOString().slice(0, 10),
          item.notes || '',
        ]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return studyLogs;
}

module.exports = {
  pool,
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  getSemesters,
  saveSemesters,
  getAssignments,
  saveAssignments,
  getStudyLogs,
  saveStudyLogs,
};
