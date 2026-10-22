export type GradeLetter =
  | 'A+'
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'C-'
  | 'D'
  | 'F';

export type CourseCategory = 'core' | 'elective' | 'general';
export type CourseStatus = 'passed' | 'failed' | 'in_progress';

export interface Course {
  id: string; // client id (e.g. 'course-1' or uuid)
  name: string; // Course title/name e.g. "Introduction to Calculus"
  credits: number; // e.g. 4
  grade: string; // e.g. 'A', '4.00', 'B+'
  category?: CourseCategory; // 'core' | 'elective' | 'general'
  status?: CourseStatus; // 'passed' | 'failed' | 'in_progress'
  isRetake?: boolean;
}

export interface Semester {
  id: string; // semester client id (e.g. 'sem-default-1')
  description: string; // e.g. "Year 1, Semester I"
  number: number; // e.g. 1
  courses: Course[];
}

export interface AcademicProfile {
  name: string;
  studentId: string;
  major: string;
  targetCgpa: number;
  graduationCredits: number;
  coreCreditsRequired: number;
  electiveCreditsRequired: number;
}

export interface User {
  email: string;
  name: string;
  studentId?: string;
  major?: string;
  targetCgpa?: number;
  graduationCredits?: number;
}

export interface Assignment {
  id: string;
  title: string;
  courseName: string;
  type?: string;
  dueDate: string | null;
  completed: boolean;
  notes?: string;
}

export interface StudyLog {
  id: string;
  courseName: string;
  hours: number;
  logDate: string;
  notes?: string;
}
