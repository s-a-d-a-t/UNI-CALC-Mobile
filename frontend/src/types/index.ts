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
  | 'F'
  | 'W' // Withdrawn (doesn't affect GPA)
  | 'I'; // Incomplete (doesn't affect GPA)

export interface Course {
  id: string;
  code: string; // e.g. "CS101"
  title: string; // e.g. "Introduction to Computer Science"
  credits: number; // e.g. 3 or 4
  grade?: GradeLetter; // Awarded grade
  isRetake?: boolean; // True if repeating an earlier course
  previousCourseId?: string; // Links to previous attempt
}

export interface Semester {
  id: string;
  name: string; // e.g. "Fall 2025"
  year: number;
  season: 'Fall' | 'Spring' | 'Summer' | 'Winter';
  courses: Course[];
  gpa?: number;
  totalCredits?: number;
  earnedCredits?: number;
}

export interface AcademicProfile {
  id: string;
  fullName: string;
  studentId?: string;
  department?: string;
  targetCGPA?: number;
  currentCGPA: number;
  totalEarnedCredits: number;
}

export interface Assignment {
  id: string;
  courseCode: string;
  title: string;
  dueDate: string;
  weightPercentage?: number;
  isCompleted: boolean;
  score?: number;
  maxScore?: number;
}

export interface StudyLog {
  id: string;
  courseCode: string;
  durationMinutes: number;
  date: string;
  notes?: string;
}
