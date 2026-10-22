import { Course, CourseCategory, CourseStatus, Semester, AcademicProfile } from '../types';

export interface GradeScaleItem {
  label: string;
  value: string;
  points: number;
  letter: string;
}

export const GRADE_SCALE: GradeScaleItem[] = [
  { label: 'A+ (4.0)', value: 'A+', points: 4.0, letter: 'A+' },
  { label: 'A (4.0)', value: 'A', points: 4.0, letter: 'A' },
  { label: 'A- (3.75)', value: 'A-', points: 3.75, letter: 'A-' },
  { label: 'B+ (3.50)', value: 'B+', points: 3.5, letter: 'B+' },
  { label: 'B (3.00)', value: 'B', points: 3.0, letter: 'B' },
  { label: 'B- (2.75)', value: 'B-', points: 2.75, letter: 'B-' },
  { label: 'C+ (2.50)', value: 'C+', points: 2.5, letter: 'C+' },
  { label: 'C (2.00)', value: 'C', points: 2.0, letter: 'C' },
  { label: 'C- (1.75)', value: 'C-', points: 1.75, letter: 'C-' },
  { label: 'D (1.00)', value: 'D', points: 1.0, letter: 'D' },
  { label: 'F (0.00)', value: 'F', points: 0.0, letter: 'F' },
];

const LEGACY_NUMERIC_GRADES: Record<string, string> = {
  '4.00': 'A',
  '3.75': 'A-',
  '3.50': 'B+',
  '3.00': 'B',
  '2.75': 'B-',
  '2.50': 'C+',
  '2.00': 'C',
  '1.75': 'C-',
  '1.00': 'D',
  '0.00': 'F',
};

export function normalizeGrade(grade: any): string {
  const raw = String(grade ?? '').trim();
  if (GRADE_SCALE.some((s) => s.value === raw)) return raw;
  const num = parseFloat(raw);
  if (!isNaN(num)) {
    const fixed = num.toFixed(2);
    if (LEGACY_NUMERIC_GRADES[fixed]) return LEGACY_NUMERIC_GRADES[fixed];
  }
  if (LEGACY_NUMERIC_GRADES[raw]) return LEGACY_NUMERIC_GRADES[raw];
  return 'F';
}

export function getGradePoints(grade: any): number {
  const normalized = normalizeGrade(grade);
  const match = GRADE_SCALE.find((s) => s.value === normalized);
  if (match) return match.points;
  const num = parseFloat(grade);
  return isNaN(num) ? 0 : num;
}

export function getGradeLetter(value: any): string {
  return normalizeGrade(value);
}

export function isPassingGrade(grade: any): boolean {
  return getGradePoints(grade) >= 2.0;
}

export function isFailedGrade(grade: any): boolean {
  return getGradePoints(grade) < 2.0;
}

export function validCourse(course: Course): boolean {
  const credits = parseFloat(String(course.credits));
  const gradeVal = getGradePoints(course.grade);
  return !isNaN(credits) && credits > 0 && !isNaN(gradeVal);
}

export function calculateSemesterStats(courses: Course[]): {
  credits: number;
  points: number;
  gpa: number;
} {
  let credits = 0;
  let points = 0;

  (courses || []).forEach((course) => {
    if (!validCourse(course)) return;
    const c = parseFloat(String(course.credits));
    const g = getGradePoints(course.grade);
    credits += c;
    points += c * g;
  });

  return {
    credits,
    points: Number(points.toFixed(2)),
    gpa: credits > 0 ? Number((points / credits).toFixed(2)) : 0,
  };
}

export function calculateGlobalStats(semesters: Semester[]): {
  totalCredits: number;
  totalPoints: number;
  cgpa: number;
} {
  let totalCredits = 0;
  let totalPoints = 0;

  (semesters || []).forEach((sem) => {
    const stats = calculateSemesterStats(sem.courses || []);
    totalCredits += stats.credits;
    totalPoints += stats.points;
  });

  return {
    totalCredits,
    totalPoints: Number(totalPoints.toFixed(2)),
    cgpa: totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0,
  };
}

export function requiredGradeForTarget(
  completedSemesters: Semester[],
  remainingCredits: number,
  targetCgpa: number
): {
  possible: boolean;
  requiredGpa: number;
  letter: string | null;
  gradeValue?: string;
} {
  const base = calculateGlobalStats(completedSemesters);
  if (remainingCredits <= 0) {
    return {
      possible: base.cgpa >= targetCgpa,
      requiredGpa: base.cgpa,
      letter: base.cgpa >= targetCgpa ? 'Achieved' : 'Not reachable',
    };
  }

  const requiredTotalPoints = targetCgpa * (base.totalCredits + remainingCredits);
  const pointsNeeded = requiredTotalPoints - base.totalPoints;
  const requiredGpa = Number((pointsNeeded / remainingCredits).toFixed(2));

  if (requiredGpa > 4.0) return { possible: false, requiredGpa, letter: null };
  if (requiredGpa <= 0) return { possible: true, requiredGpa: 0, letter: 'Any passing grade' };

  const closest = GRADE_SCALE.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.points - requiredGpa);
    const currDiff = Math.abs(curr.points - requiredGpa);
    return currDiff < prevDiff ? curr : prev;
  });

  return {
    possible: requiredGpa <= 4.0,
    requiredGpa,
    letter: closest.label,
    gradeValue: closest.value,
  };
}

export function analyzeRetakes(semesters: Semester[], retakeTargetGrade = 'B+') {
  const retakeCandidates: any[] = [];
  const global = calculateGlobalStats(semesters);

  (semesters || []).forEach((sem) => {
    (sem.courses || []).forEach((course) => {
      if (!validCourse(course)) return;
      if (!isFailedGrade(course.grade) && course.status !== 'failed') return;

      const credits = parseFloat(String(course.credits));
      const oldGrade = getGradePoints(course.grade);
      const newGrade = getGradePoints(retakeTargetGrade);
      const impact = global.totalCredits > 0 ? (credits * (newGrade - oldGrade)) / global.totalCredits : 0;

      retakeCandidates.push({
        courseId: course.id,
        courseName: course.name || 'Unnamed course',
        semester: sem.description || `Semester ${sem.number}`,
        credits,
        oldGrade,
        oldLetter: getGradeLetter(course.grade),
        newGrade,
        newLetter: getGradeLetter(retakeTargetGrade),
        cgpaLift: Number(impact.toFixed(3)),
        newCgpa: Number((global.cgpa + impact).toFixed(2)),
      });
    });
  });

  return retakeCandidates.sort((a, b) => b.cgpaLift - a.cgpaLift);
}

export function getGraduationStats(semesters: Semester[], profile?: AcademicProfile | null) {
  const gradGoal = profile?.graduationCredits ?? 145;
  const coreRequired = profile?.coreCreditsRequired ?? 100;
  const electiveRequired = profile?.electiveCreditsRequired ?? 45;

  let totalCredits = 0;
  let coreCredits = 0;
  let electiveCredits = 0;
  let generalCredits = 0;
  let failedCount = 0;
  let retakeCount = 0;
  const failedCourses: { name: string; grade: string; semester: string }[] = [];

  (semesters || []).forEach((sem) => {
    (sem.courses || []).forEach((course) => {
      if (!validCourse(course)) return;
      const credits = parseFloat(String(course.credits));
      totalCredits += credits;

      const cat = course.category || 'core';
      if (cat === 'elective') electiveCredits += credits;
      else if (cat === 'general') generalCredits += credits;
      else coreCredits += credits;

      if (isFailedGrade(course.grade) || course.status === 'failed') {
        failedCount += 1;
        failedCourses.push({
          name: course.name,
          grade: getGradeLetter(course.grade),
          semester: sem.description || `Semester ${sem.number}`,
        });
      }
      if (course.isRetake) retakeCount += 1;
    });
  });

  return {
    totalCredits,
    remainingCredits: Math.max(gradGoal - totalCredits, 0),
    gradGoal,
    progressPercent: Math.min(Math.round((totalCredits / gradGoal) * 100), 100),
    coreCredits,
    coreRequired,
    coreRemaining: Math.max(coreRequired - coreCredits, 0),
    electiveCredits,
    electiveRequired,
    electiveRemaining: Math.max(electiveRequired - electiveCredits, 0),
    generalCredits,
    failedCount,
    retakeCount,
    failedCourses,
  };
}
