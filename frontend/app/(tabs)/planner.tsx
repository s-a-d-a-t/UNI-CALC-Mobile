import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Semester } from '@/src/types';
import { calculateSemesterGPA } from '@/src/lib/gpa';

export default function PlannerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [semesters] = useState<Semester[]>([
    {
      id: 'sem-1',
      name: 'Fall 2025 (Current)',
      year: 2025,
      season: 'Fall',
      courses: [
        { id: 'c1', code: 'CS301', title: 'Data Structures & Algorithms', credits: 4, grade: 'A' },
        { id: 'c2', code: 'MATH201', title: 'Linear Algebra', credits: 3, grade: 'B+' },
        { id: 'c3', code: 'CS305', title: 'Operating Systems', credits: 4, grade: 'A-' },
        { id: 'c4', code: 'PHYS102', title: 'General Physics II', credits: 4, grade: 'B', isRetake: true },
      ],
    },
    {
      id: 'sem-2',
      name: 'Spring 2025',
      year: 2025,
      season: 'Spring',
      courses: [
        { id: 'c5', code: 'CS201', title: 'Object-Oriented Programming', credits: 4, grade: 'A' },
        { id: 'c6', code: 'MATH102', title: 'Calculus II', credits: 4, grade: 'B' },
        { id: 'c7', code: 'ENG101', title: 'Academic English', credits: 3, grade: 'A' },
        { id: 'c8', code: 'PHYS101', title: 'General Physics I', credits: 4, grade: 'C+' },
      ],
    },
  ]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]}
      contentContainerStyle={styles.contentContainer}>
      
      {/* Header with Add Semester button */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Academic History</Text>
          <Text style={styles.subtitle}>{semesters.length} Semesters Recorded</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Term</Text>
        </TouchableOpacity>
      </View>

      {/* Semester Cards */}
      {semesters.map((sem) => {
        const summary = calculateSemesterGPA(sem.courses);

        return (
          <View
            key={sem.id}
            style={[
              styles.semesterCard,
              { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
            ]}>
            {/* Semester Header */}
            <View style={styles.semesterCardHeader}>
              <View>
                <Text style={[styles.semesterCardTitle, { color: theme.text }]}>
                  {sem.name}
                </Text>
                <Text style={styles.semesterCreditsText}>
                  {summary.earnedCredits} Credits Earned
                </Text>
              </View>

              <View style={styles.gpaPill}>
                <Text style={styles.gpaPillLabel}>GPA</Text>
                <Text style={styles.gpaPillValue}>{summary.gpa.toFixed(2)}</Text>
              </View>
            </View>

            {/* Courses Table */}
            <View style={styles.courseList}>
              {sem.courses.map((course) => (
                <View key={course.id} style={styles.courseItem}>
                  <View style={styles.courseInfo}>
                    <View style={styles.codeRow}>
                      <Text style={[styles.courseCode, { color: theme.text }]}>
                        {course.code}
                      </Text>
                      {course.isRetake && (
                        <View style={styles.retakeBadge}>
                          <Text style={styles.retakeText}>RETAKE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.courseTitle} numberOfLines={1}>
                      {course.title}
                    </Text>
                  </View>

                  <View style={styles.courseGradeBox}>
                    <Text style={styles.courseCredits}>{course.credits} cr</Text>
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeText}>{course.grade}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  semesterCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  semesterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.15)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  semesterCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  semesterCreditsText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  gpaPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  gpaPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  gpaPillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E40AF',
  },
  courseList: {
    gap: 10,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  retakeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retakeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
  },
  courseTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  courseGradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseCredits: {
    fontSize: 12,
    color: '#6B7280',
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
});
