import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { Semester, Course } from '@/src/types';
import { calculateSemesterStats, GRADE_SCALE, normalizeGrade } from '@/src/lib/gpa';
import { AcademicAPI } from '@/src/api/academic';

export default function PlannerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const loadSemesters = async () => {
    try {
      const data = await AcademicAPI.getSemesters();
      if (data && data.length > 0) {
        setSemesters(data);
      }
    } catch (e) {
      console.warn('Failed to load semesters:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSemesters();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSemesters();
    setRefreshing(false);
  };

  const syncSemesters = async (updated: Semester[]) => {
    setSemesters(updated);
    try {
      await AcademicAPI.saveSemesters(updated);
    } catch (e) {
      console.warn('Saved locally, will sync when online');
    }
  };

  const addSemester = () => {
    const nextNumber = semesters.length + 1;
    const newSemester: Semester = {
      id: `sem-${Date.now()}`,
      description: `Year ${Math.ceil(nextNumber / 2)}, Semester ${nextNumber % 2 === 1 ? 'I' : 'II'}`,
      number: nextNumber,
      courses: [
        {
          id: `course-${Date.now()}-1`,
          name: 'New Course',
          credits: 3,
          grade: '4.00',
          category: 'core',
          status: 'passed',
        },
      ],
    };
    const updated = [...semesters, newSemester];
    syncSemesters(updated);
  };

  const addCourseToSemester = (semId: string) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semId) return sem;
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        name: `Course ${(sem.courses?.length || 0) + 1}`,
        credits: 3,
        grade: 'A',
        category: 'core',
        status: 'passed',
      };
      return {
        ...sem,
        courses: [...(sem.courses || []), newCourse],
      };
    });
    syncSemesters(updated);
  };

  const removeCourse = (semId: string, courseId: string) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semId) return sem;
      return {
        ...sem,
        courses: sem.courses.filter((c) => c.id !== courseId),
      };
    });
    syncSemesters(updated);
  };

  const updateCourseField = (
    semId: string,
    courseId: string,
    field: keyof Course,
    val: any
  ) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semId) return sem;
      return {
        ...sem,
        courses: sem.courses.map((c) =>
          c.id === courseId ? { ...c, [field]: val } : c
        ),
      };
    });
    syncSemesters(updated);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Academic Planner</Text>
          <Text style={styles.subtitle}>{semesters.length} Semesters Recorded</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addSemester}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Term</Text>
        </TouchableOpacity>
      </View>

      {/* Semesters List */}
      {semesters.map((sem) => {
        const stats = calculateSemesterStats(sem.courses || []);

        return (
          <View
            key={sem.id}
            style={[
              styles.semesterCard,
              { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
            ]}>
            {/* Semester Header */}
            <View style={styles.semesterCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.semesterCardTitle, { color: theme.text }]}>
                  {sem.description || `Semester ${sem.number}`}
                </Text>
                <Text style={styles.semesterCreditsText}>
                  {stats.credits} Credits • {sem.courses?.length || 0} Courses
                </Text>
              </View>

              <View style={styles.gpaPill}>
                <Text style={styles.gpaPillLabel}>TERM GPA</Text>
                <Text style={styles.gpaPillValue}>{stats.gpa.toFixed(2)}</Text>
              </View>
            </View>

            {/* Courses List */}
            <View style={styles.courseList}>
              {(sem.courses || []).map((course) => {
                const normalized = normalizeGrade(course.grade);

                return (
                  <View key={course.id} style={styles.courseItem}>
                    <View style={styles.courseInfo}>
                      <TextInput
                        style={[styles.courseNameInput, { color: theme.text }]}
                        value={course.name}
                        placeholder="Course Name"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={(text) =>
                          updateCourseField(sem.id, course.id, 'name', text)
                        }
                      />
                      <View style={styles.badgeRow}>
                        <Text style={styles.creditText}>{course.credits} Credits</Text>
                        {course.isRetake && (
                          <View style={styles.retakeBadge}>
                            <Text style={styles.retakeText}>RETAKE</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Grade Selector & Actions */}
                    <View style={styles.gradeActions}>
                      <TouchableOpacity
                        style={styles.gradeBadge}
                        onPress={() => {
                          // Cycle through grades on tap: A+ -> A -> B+ -> B -> C+ -> C -> F
                          const nextGradeMap: Record<string, string> = {
                            'A+': 'A',
                            'A': 'A-',
                            'A-': 'B+',
                            'B+': 'B',
                            'B': 'B-',
                            'B-': 'C+',
                            'C+': 'C',
                            'C': 'D',
                            'D': 'F',
                            'F': 'A+',
                          };
                          const nextGrade = nextGradeMap[normalized] || 'A';
                          updateCourseField(sem.id, course.id, 'grade', nextGrade);
                        }}>
                        <Text style={styles.gradeText}>{normalized}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeCourse(sem.id, course.id)}
                        style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Add Course Button */}
            <TouchableOpacity
              style={styles.addCourseBtn}
              onPress={() => addCourseToSemester(sem.id)}>
              <Ionicons name="add-circle-outline" size={16} color="#2563EB" />
              <Text style={styles.addCourseBtnText}>Add Course to Term</Text>
            </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: '800',
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
    gap: 4,
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
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  gpaPillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E40AF',
  },
  courseList: {
    gap: 12,
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
  courseNameInput: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  creditText: {
    fontSize: 12,
    color: '#6B7280',
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
  gradeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeBadge: {
    minWidth: 42,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  trashBtn: {
    padding: 6,
  },
  addCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.15)',
    gap: 6,
  },
  addCourseBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
});
