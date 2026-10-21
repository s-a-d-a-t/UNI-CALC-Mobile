import { Course, GradeLetter, Semester } from '../types';

/**
 * Standard 4.0 Academic Grade Scale Mapping
 */
export const GRADE_POINTS: Record<GradeLetter, number | null> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.75,
  'B+': 3.5,
  'B': 3.0,
  'B-': 2.75,
  'C+': 2.5,
  'C': 2.0,
  'C-': 1.75,
  'D': 1.0,
  'F': 0.0,
  'W': null, // Withdrawn: Excluded from GPA
  'I': null, // Incomplete: Excluded from GPA
};

export interface GPASummary {
  gpa: number;
  totalCredits: number;
  earnedCredits: number; // Credits with passing grade (grade > 0)
  qualityPoints: number;
}

/**
 * Calculates GPA for a single semester or course list
 */
export function calculateSemesterGPA(courses: Course[]): GPASummary {
  let qualityPoints = 0;
  let totalCredits = 0;
  let earnedCredits = 0;

  for (const course of courses) {
    if (!course.grade) continue;

    const points = GRADE_POINTS[course.grade];
    // Ignore non-credit / non-evaluated grades (e.g. W, I)
    if (points === null || points === undefined) continue;

    const courseCredits = Number(course.credits) || 0;
    if (courseCredits <= 0) continue;

    qualityPoints += points * courseCredits;
    totalCredits += courseCredits;

    // Passing grade earns credits
    if (points > 0) {
      earnedCredits += courseCredits;
    }
  }

  const gpa = totalCredits > 0 ? qualityPoints / totalCredits : 0;

  return {
    gpa: Number(gpa.toFixed(2)),
    totalCredits,
    earnedCredits,
    qualityPoints: Number(qualityPoints.toFixed(2)),
  };
}

/**
 * Calculates Cumulative GPA (CGPA) across all semesters,
 * correctly handling repeated/retake courses (replacing prior attempts).
 */
export function calculateCGPA(semesters: Semester[]): GPASummary {
  // Map of courseCode -> latest Course attempt to handle retakes
  const latestCourseAttempts = new Map<string, Course>();

  for (const semester of semesters) {
    for (const course of semester.courses) {
      if (!course.grade) continue;

      const codeKey = course.code.trim().toUpperCase();
      // If course is marked as retake or same code repeated, latest attempt overrides
      latestCourseAttempts.set(codeKey, course);
    }
  }

  return calculateSemesterGPA(Array.from(latestCourseAttempts.values()));
}

/**
 * Predicts the required GPA in remaining credits to achieve a target CGPA.
 * Formula: Required GPA = [Target CGPA * (Completed Credits + Remaining Credits) - (Current CGPA * Completed Credits)] / Remaining Credits
 */
export function predictRequiredGPA(
  currentCGPA: number,
  completedCredits: number,
  targetCGPA: number,
  remainingCredits: number
): { requiredGPA: number; isAchievable: boolean } {
  if (remainingCredits <= 0) {
    return {
      requiredGPA: currentCGPA,
      isAchievable: currentCGPA >= targetCGPA,
    };
  }

  const totalCredits = completedCredits + remainingCredits;
  const currentTotalPoints = currentCGPA * completedCredits;
  const targetTotalPoints = targetCGPA * totalCredits;

  const neededPoints = targetTotalPoints - currentTotalPoints;
  const requiredGPA = neededPoints / remainingCredits;

  return {
    requiredGPA: Number(requiredGPA.toFixed(2)),
    // In a 4.0 system, target is achievable if required GPA <= 4.0
    isAchievable: requiredGPA <= 4.0 && requiredGPA >= 0,
  };
}
