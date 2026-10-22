const { z } = require('zod');

// Auth validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  major: z.string().max(100, 'Major must be less than 100 characters').optional().default(''),
  studentId: z.string().max(50, 'Student ID must be less than 50 characters').optional().default(''),
});

// Profile validation schema
const profileSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').default(''),
  studentId: z.string().max(50, 'Student ID must be less than 50 characters').default(''),
  major: z.string().max(100, 'Major must be less than 100 characters').default(''),
  targetCgpa: z.number().min(0, 'Target CGPA must be >= 0').max(4.0, 'Target CGPA must be <= 4.0').default(3.5),
  graduationCredits: z.number().int().min(1, 'Graduation credits must be at least 1').max(500, 'Graduation credits must be <= 500').default(145),
  coreCreditsRequired: z.number().int().min(0, 'Core credits must be >= 0').max(500, 'Core credits must be <= 500').default(100),
  electiveCreditsRequired: z.number().int().min(0, 'Elective credits must be >= 0').max(500, 'Elective credits must be <= 500').default(45),
});

// Course validation schema
const courseSchema = z.object({
  id: z.string(),
  name: z.string().max(200, 'Course name must be less than 200 characters').default(''),
  credits: z.number().int().min(0, 'Credits must be >= 0').max(20, 'Credits must be <= 20').default(0),
  grade: z.string().max(10, 'Grade must be less than 10 characters').default('4.00'),
  category: z.enum(['core', 'elective']).default('core'),
  status: z.enum(['passed', 'failed', 'dropped']).default('passed'),
  isRetake: z.boolean().default(false),
});

// Semester validation schema
const semesterSchema = z.object({
  id: z.string(),
  description: z.string().max(200, 'Description must be less than 200 characters').default(''),
  number: z.number().int().min(1, 'Semester number must be >= 1').max(20, 'Semester number must be <= 20').default(0),
  courses: z.array(courseSchema).max(50, 'Maximum 50 courses per semester').default([]),
});

const semestersSchema = z.object({
  semesters: z.array(semesterSchema).max(20, 'Maximum 20 semesters allowed'),
});

// Assignment validation schema
const assignmentSchema = z.object({
  id: z.string(),
  title: z.string().max(200, 'Title must be less than 200 characters').default(''),
  courseName: z.string().max(200, 'Course name must be less than 200 characters').default(''),
  type: z.enum(['assignment', 'exam', 'project']).default('assignment'),
  dueDate: z.string().nullable().default(null),
  completed: z.boolean().default(false),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').default(''),
});

const assignmentsSchema = z.object({
  assignments: z.array(assignmentSchema).max(1000, 'Maximum 1000 assignments allowed'),
});

// Study log validation schema
const studyLogSchema = z.object({
  id: z.string(),
  courseName: z.string().max(200, 'Course name must be less than 200 characters').default(''),
  hours: z.number().min(0, 'Hours must be >= 0').max(24, 'Hours cannot exceed 24 per day').default(0),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').default(''),
});

const studyLogsSchema = z.object({
  studyLogs: z.array(studyLogSchema).max(5000, 'Maximum 5000 study logs allowed'),
});

// Validation middleware factory
function validateRequestBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return res.status(400).json({ error: `Validation error: ${messages}` });
      }
      res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

module.exports = {
  loginSchema,
  registerSchema,
  profileSchema,
  semestersSchema,
  assignmentsSchema,
  studyLogsSchema,
  validateRequestBody,
};
