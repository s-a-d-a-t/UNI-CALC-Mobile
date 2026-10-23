import React, { useState, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { Semester, Course, CourseCategory, CourseStatus } from '@/src/types';
import {
  calculateSemesterStats,
  calculateGlobalStats,
  GRADE_SCALE,
  GRADE_COLORS,
  formatGpa,
  normalizeGrade,
  COURSE_CATEGORIES,
  COURSE_STATUSES,
} from '@/src/lib/gpa';
import { AcademicAPI } from '@/src/api/academic';

export default function CalculatorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Grade Picker Modal state
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

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
      console.warn('Saved to local storage, will sync when online');
    }
  };

  const updateCourse = (
    semesterId: string,
    courseId: string,
    field: keyof Course,
    value: any
  ) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semesterId) return sem;
      return {
        ...sem,
        courses: sem.courses.map((course) => {
          if (course.id !== courseId) return course;
          return {
            ...course,
            [field]: field === 'credits' ? (value === '' ? '' : parseInt(value, 10) || 0) : value,
          };
        }),
      };
    });
    syncSemesters(updated);
  };

  const addCourseRow = (semesterId: string) => {
    const updated = semesters.map((sem) => {
      if (sem.id !== semesterId) return sem;
      const newCourse: Course = {
        id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: '',
        credits: 3,
        grade: 'A',
        category: 'core',
        status: 'passed',
        isRetake: false,
      };
      return { ...sem, courses: [...sem.courses, newCourse] };
    });
    syncSemesters(updated);
  };

  const deleteCourseRow = (semesterId: string, courseId: string) => {
    const sem = semesters.find((s) => s.id === semesterId);
    if (!sem || sem.courses.length <= 1) {
      Alert.alert('Cannot Remove', 'Each semester must have at least one course row.');
      return;
    }
    const updated = semesters.map((s) => {
      if (s.id !== semesterId) return s;
      return {
        ...s,
        courses: s.courses.filter((c) => c.id !== courseId),
      };
    });
    syncSemesters(updated);
  };

  const addSemester = () => {
    const nextNumber = semesters.length + 1;
    const ts = Date.now();
    const newSem: Semester = {
      id: `sem-${ts}`,
      description: `Year ${Math.ceil(nextNumber / 2)}, Semester ${nextNumber % 2 === 1 ? 'I' : 'II'}`,
      number: nextNumber,
      courses: [
        { id: `course-${ts}-1`, name: '', credits: 4, grade: 'A', category: 'core', status: 'passed' },
        { id: `course-${ts}-2`, name: '', credits: 3, grade: 'A', category: 'core', status: 'passed' },
        { id: `course-${ts}-3`, name: '', credits: 3, grade: 'A', category: 'core', status: 'passed' },
      ],
    };
    syncSemesters([...semesters, newSem]);
  };

  const deleteSemester = (semesterId: string) => {
    if (semesters.length <= 1) {
      Alert.alert('Cannot Delete', 'At least one semester is required in your academic log.');
      return;
    }
    Alert.alert('Delete Semester', 'Are you sure you want to delete this entire semester and its courses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          syncSemesters(semesters.filter((s) => s.id !== semesterId));
        },
      },
    ]);
  };

  const openGradePicker = (semesterId: string, courseId: string) => {
    setSelectedSemesterId(semesterId);
    setSelectedCourseId(courseId);
    setGradeModalVisible(true);
  };

  const handleSelectGrade = (gradeLetter: string) => {
    if (selectedSemesterId && selectedCourseId) {
      updateCourse(selectedSemesterId, selectedCourseId, 'grade', gradeLetter);
    }
    setGradeModalVisible(false);
  };

  const globalStats = calculateGlobalStats(semesters);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top CGPA Live Bar */}
      <View style={[styles.liveBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.liveBarItem}>
          <Text style={[styles.liveBarLabel, { color: theme.textMuted }]}>CUMULATIVE CGPA</Text>
          <Text style={[styles.liveBarValue, { color: theme.tint }]}>
            {formatGpa(globalStats.cgpa)}
          </Text>
        </View>
        <View style={[styles.liveBarDivider, { backgroundColor: theme.border }]} />
        <View style={styles.liveBarItem}>
          <Text style={[styles.liveBarLabel, { color: theme.textMuted }]}>TOTAL CREDITS</Text>
          <Text style={[styles.liveBarValue, { color: theme.text }]}>
            {globalStats.totalCredits} hrs
          </Text>
        </View>
        <View style={[styles.liveBarDivider, { backgroundColor: theme.border }]} />
        <View style={styles.liveBarItem}>
          <Text style={[styles.liveBarLabel, { color: theme.textMuted }]}>TOTAL TERMS</Text>
          <Text style={[styles.liveBarValue, { color: theme.text }]}>
            {semesters.length}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}>
        
        {/* Semester Cards */}
        {semesters.map((sem, sIndex) => {
          const stats = calculateSemesterStats(sem.courses);
          return (
            <View key={sem.id} style={[styles.semCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Semester Header */}
              <View style={[styles.semHeader, { borderBottomColor: theme.border, backgroundColor: theme.cardMuted }]}>
                <View style={styles.semHeaderLeft}>
                  <TextInput
                    style={[styles.semDescriptionInput, { color: theme.text }]}
                    value={sem.description}
                    onChangeText={(val) => {
                      const updated = semesters.map((s) => (s.id === sem.id ? { ...s, description: val } : s));
                      syncSemesters(updated);
                    }}
                    placeholder={`Year ${Math.ceil((sIndex + 1) / 2)}, Semester ${(sIndex + 1) % 2 === 1 ? 'I' : 'II'}`}
                    placeholderTextColor={theme.textMuted}
                  />
                  <Text style={[styles.semSubtext, { color: theme.textMuted }]}>
                    {stats.credits} credit hours · {sem.courses.length} courses
                  </Text>
                </View>

                <View style={styles.semHeaderRight}>
                  {/* Term GPA Badge */}
                  <View style={[styles.gpaPill, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                    <Text style={[styles.gpaPillLabel, { color: theme.textMuted }]}>GPA</Text>
                    <Text style={[styles.gpaPillValue, { color: theme.tint }]}>
                      {formatGpa(stats.gpa)}
                    </Text>
                  </View>

                  {semesters.length > 1 && (
                    <TouchableOpacity
                      onPress={() => deleteSemester(sem.id)}
                      style={[styles.deleteSemBtn, { borderColor: theme.border }]}>
                      <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Courses Table */}
              <View style={styles.coursesTable}>
                {sem.courses.map((course, cIndex) => {
                  const normalized = normalizeGrade(course.grade);
                  return (
                    <View
                      key={course.id}
                      style={[
                        styles.courseRow,
                        { borderBottomColor: theme.border },
                        cIndex === sem.courses.length - 1 && { borderBottomWidth: 0 },
                      ]}>
                      
                      {/* Course Name & Category Tags */}
                      <View style={styles.courseMainCol}>
                        <TextInput
                          style={[styles.courseNameInput, { color: theme.text }]}
                          value={course.name}
                          onChangeText={(val) => updateCourse(sem.id, course.id, 'name', val)}
                          placeholder="Course title e.g. General Physics"
                          placeholderTextColor={theme.textMuted}
                        />

                        {/* Attribute Badges Row */}
                        <View style={styles.attributesRow}>
                          {/* Category Tag (Core / Elective) */}
                          <TouchableOpacity
                            onPress={() => {
                              const nextCat = course.category === 'elective' ? 'core' : 'elective';
                              updateCourse(sem.id, course.id, 'category', nextCat);
                            }}
                            style={[
                              styles.attrBadge,
                              {
                                backgroundColor: course.category === 'elective' ? 'rgba(59,130,246,0.15)' : theme.cardMuted,
                                borderColor: theme.border,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.attrBadgeText,
                                { color: course.category === 'elective' ? '#3B82F6' : theme.textMuted },
                              ]}>
                              {course.category === 'elective' ? 'Elective' : 'Core'}
                            </Text>
                          </TouchableOpacity>

                          {/* Retake Tag */}
                          <TouchableOpacity
                            onPress={() => updateCourse(sem.id, course.id, 'isRetake', !course.isRetake)}
                            style={[
                              styles.attrBadge,
                              {
                                backgroundColor: course.isRetake ? 'rgba(239,68,68,0.15)' : theme.cardMuted,
                                borderColor: theme.border,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.attrBadgeText,
                                { color: course.isRetake ? theme.danger : theme.textMuted },
                              ]}>
                              {course.isRetake ? 'Retake' : 'Standard'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Credits Input */}
                      <View style={styles.creditsCol}>
                        <Text style={[styles.miniHeader, { color: theme.textMuted }]}>CR</Text>
                        <TextInput
                          style={[styles.creditsInput, { color: theme.text, backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                          value={String(course.credits)}
                          onChangeText={(val) => updateCourse(sem.id, course.id, 'credits', val)}
                          keyboardType="number-pad"
                          maxLength={2}
                        />
                      </View>

                      {/* Grade Selector Button */}
                      <View style={styles.gradeCol}>
                        <Text style={[styles.miniHeader, { color: theme.textMuted }]}>GRADE</Text>
                        <TouchableOpacity
                          onPress={() => openGradePicker(sem.id, course.id)}
                          style={[
                            styles.gradeBtn,
                            {
                              backgroundColor: GRADE_COLORS[normalized] || theme.tint,
                            },
                          ]}>
                          <Text style={styles.gradeBtnText}>{normalized}</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Delete Course Row */}
                      <TouchableOpacity
                        onPress={() => deleteCourseRow(sem.id, course.id)}
                        style={styles.deleteCourseBtn}>
                        <Ionicons name="close-circle-outline" size={20} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Add Course Row Button */}
              <TouchableOpacity
                onPress={() => addCourseRow(sem.id)}
                style={[styles.addCourseBtn, { borderTopColor: theme.border, backgroundColor: theme.cardMuted }]}>
                <Ionicons name="add" size={18} color={theme.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.addCourseBtnText, { color: theme.tint }]}>Add Course</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Semester Button */}
        <TouchableOpacity
          onPress={addSemester}
          style={[styles.addSemBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.addSemIconCircle, { backgroundColor: theme.badgeBg }]}>
            <Ionicons name="add" size={20} color={theme.tint} />
          </View>
          <Text style={[styles.addSemText, { color: theme.text }]}>Add New Semester</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Ethiopian Letter Grade Picker Modal */}
      <Modal
        visible={gradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGradeModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGradeModalVisible(false)}>
          <View style={[styles.gradePickerModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.gradePickerHeader}>
              <Text style={[styles.gradePickerTitle, { color: theme.text }]}>Select Course Grade</Text>
              <Text style={[styles.gradePickerSubtitle, { color: theme.textMuted }]}>
                Standard Ethiopian Higher Education Scale
              </Text>
            </View>

            <View style={styles.gradePickerGrid}>
              {GRADE_SCALE.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => handleSelectGrade(item.value)}
                  style={[
                    styles.gradePickerOption,
                    {
                      backgroundColor: GRADE_COLORS[item.value] || theme.tint,
                    },
                  ]}>
                  <Text style={styles.gradePickerOptionLetter}>{item.letter}</Text>
                  <Text style={styles.gradePickerOptionPoints}>({item.points.toFixed(2)})</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setGradeModalVisible(false)}
              style={[styles.closeModalBtn, { borderColor: theme.border }]}>
              <Text style={[styles.closeModalText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  liveBarItem: {
    alignItems: 'center',
  },
  liveBarLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveBarValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  liveBarDivider: {
    width: 1,
    height: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  semCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  semHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  semHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  semDescriptionInput: {
    fontSize: 15,
    fontWeight: '800',
    padding: 0,
    letterSpacing: -0.2,
  },
  semSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  semHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  gpaPillLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  gpaPillValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  deleteSemBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coursesTable: {
    paddingHorizontal: 14,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  courseMainCol: {
    flex: 1,
  },
  courseNameInput: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
  attributesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  attrBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  attrBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  creditsCol: {
    alignItems: 'center',
    width: 38,
  },
  miniHeader: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  creditsInput: {
    width: 36,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    padding: 0,
  },
  gradeCol: {
    alignItems: 'center',
    width: 48,
  },
  gradeBtn: {
    width: 46,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  deleteCourseBtn: {
    padding: 4,
  },
  addCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  addCourseBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  addSemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  addSemIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSemText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradePickerModal: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  gradePickerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gradePickerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  gradePickerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  gradePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  gradePickerOption: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePickerOptionLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  gradePickerOptionPoints: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  closeModalBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
