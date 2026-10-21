import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import {
  calculateSemesterGPA,
  predictRequiredGPA,
  GRADE_POINTS,
} from '@/src/lib/gpa';
import { Course, GradeLetter } from '@/src/types';

const AVAILABLE_GRADES: GradeLetter[] = [
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F',
];

export default function CalculatorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [activeMode, setActiveMode] = useState<'term' | 'predict'>('term');

  // State for Term GPA Calculator
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', code: 'CS301', title: 'Data Structures', credits: 3, grade: 'A' },
    { id: '2', code: 'MATH201', title: 'Linear Algebra', credits: 4, grade: 'B+' },
    { id: '3', code: 'ENG102', title: 'Technical Writing', credits: 3, grade: 'A-' },
  ]);

  // State for Target CGPA Predictor
  const [currentCgpaInput, setCurrentCgpaInput] = useState('3.40');
  const [completedCreditsInput, setCompletedCreditsInput] = useState('60');
  const [targetCgpaInput, setTargetCgpaInput] = useState('3.70');
  const [remainingCreditsInput, setRemainingCreditsInput] = useState('30');

  // Real-time calculation of Term GPA
  const termSummary = useMemo(() => {
    return calculateSemesterGPA(courses);
  }, [courses]);

  // Real-time prediction calculation
  const prediction = useMemo(() => {
    const curCGPA = parseFloat(currentCgpaInput) || 0;
    const compCredits = parseFloat(completedCreditsInput) || 0;
    const tgtCGPA = parseFloat(targetCgpaInput) || 0;
    const remCredits = parseFloat(remainingCreditsInput) || 0;

    return predictRequiredGPA(curCGPA, compCredits, tgtCGPA, remCredits);
  }, [currentCgpaInput, completedCreditsInput, targetCgpaInput, remainingCreditsInput]);

  const addCourseRow = () => {
    const newId = Date.now().toString();
    setCourses((prev) => [
      ...prev,
      { id: newId, code: `Course ${prev.length + 1}`, title: '', credits: 3, grade: 'A' },
    ]);
  };

  const removeCourseRow = (id: string) => {
    if (courses.length <= 1) {
      Alert.alert('Notice', 'You need at least one course in the calculation.');
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]}
      contentContainerStyle={styles.contentContainer}>
      
      {/* Tab Switcher: Term Calculator vs Predictor */}
      <View style={[styles.modeToggle, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#E5E7EB' }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeMode === 'term' && styles.toggleBtnActive]}
          onPress={() => setActiveMode('term')}>
          <Text
            style={[
              styles.toggleBtnText,
              activeMode === 'term' ? styles.toggleTextActive : { color: theme.text },
            ]}>
            Term GPA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeMode === 'predict' && styles.toggleBtnActive]}
          onPress={() => setActiveMode('predict')}>
          <Text
            style={[
              styles.toggleBtnText,
              activeMode === 'predict' ? styles.toggleTextActive : { color: theme.text },
            ]}>
            Target Predictor
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODE 1: Term GPA Calculator */}
      {activeMode === 'term' ? (
        <View>
          {/* Result Banner */}
          <View style={styles.resultBanner}>
            <View>
              <Text style={styles.bannerLabel}>CALCULATED TERM GPA</Text>
              <Text style={styles.bannerValue}>{termSummary.gpa.toFixed(2)}</Text>
            </View>
            <View style={styles.bannerRight}>
              <Text style={styles.bannerSubLabel}>Total Credits</Text>
              <Text style={styles.bannerSubVal}>{termSummary.totalCredits}</Text>
            </View>
          </View>

          {/* Dynamic Course Rows */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Courses</Text>
            <TouchableOpacity style={styles.addBtn} onPress={addCourseRow}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Course</Text>
            </TouchableOpacity>
          </View>

          {courses.map((course, index) => (
            <View
              key={course.id}
              style={[
                styles.courseRowCard,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
              ]}>
              <View style={styles.courseHeader}>
                <TextInput
                  style={[styles.courseInput, { color: theme.text }]}
                  value={course.code}
                  placeholder={`Course ${index + 1}`}
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(val) => updateCourse(course.id, 'code', val)}
                />
                <TouchableOpacity onPress={() => removeCourseRow(course.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.controlsRow}>
                {/* Credit Stepper */}
                <View style={styles.creditSelector}>
                  <Text style={styles.controlLabel}>Credits:</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        updateCourse(course.id, 'credits', Math.max(1, course.credits - 1))
                      }>
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.creditNumber, { color: theme.text }]}>
                      {course.credits}
                    </Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        updateCourse(course.id, 'credits', Math.min(12, course.credits + 1))
                      }>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Grade Picker Chips */}
                <View style={styles.gradeContainer}>
                  <Text style={styles.controlLabel}>Grade:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {AVAILABLE_GRADES.map((letter) => {
                      const isSelected = course.grade === letter;
                      return (
                        <TouchableOpacity
                          key={letter}
                          style={[
                            styles.gradeChip,
                            isSelected && styles.gradeChipSelected,
                          ]}
                          onPress={() => updateCourse(course.id, 'grade', letter)}>
                          <Text
                            style={[
                              styles.gradeChipText,
                              isSelected && styles.gradeChipTextSelected,
                            ]}>
                            {letter}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* MODE 2: Target CGPA Predictor */
        <View>
          <View
            style={[
              styles.predictionCard,
              {
                backgroundColor: prediction.isAchievable ? '#1E3A8A' : '#7F1D1D',
              },
            ]}>
            <Text style={styles.predictLabel}>
              {prediction.isAchievable ? 'REQUIRED AVERAGE GPA' : 'TARGET NOT REACHABLE'}
            </Text>
            <Text style={styles.predictValue}>
              {prediction.requiredGPA > 4.0 ? '> 4.0' : prediction.requiredGPA.toFixed(2)}
            </Text>
            <Text style={styles.predictSubtitle}>
              {prediction.isAchievable
                ? `Maintain a ${prediction.requiredGPA.toFixed(2)} average across the remaining ${remainingCreditsInput || 0} credits to reach your ${targetCgpaInput} goal.`
                : 'Even with straight A+ grades (4.0), the target exceeds the maximum possible score for the remaining credits.'}
            </Text>
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}>
            <Text style={styles.inputLabel}>Current CGPA</Text>
            <TextInput
              style={[styles.numericInput, { color: theme.text }]}
              value={currentCgpaInput}
              keyboardType="decimal-pad"
              onChangeText={setCurrentCgpaInput}
            />

            <Text style={styles.inputLabel}>Completed Credits</Text>
            <TextInput
              style={[styles.numericInput, { color: theme.text }]}
              value={completedCreditsInput}
              keyboardType="number-pad"
              onChangeText={setCompletedCreditsInput}
            />

            <Text style={styles.inputLabel}>Desired Target CGPA</Text>
            <TextInput
              style={[styles.numericInput, { color: theme.text }]}
              value={targetCgpaInput}
              keyboardType="decimal-pad"
              onChangeText={setTargetCgpaInput}
            />

            <Text style={styles.inputLabel}>Remaining Credits</Text>
            <TextInput
              style={[styles.numericInput, { color: theme.text }]}
              value={remainingCreditsInput}
              keyboardType="number-pad"
              onChangeText={setRemainingCreditsInput}
            />
          </View>
        </View>
      )}
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
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  resultBanner: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerLabel: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerValue: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    marginTop: 4,
  },
  bannerRight: {
    alignItems: 'flex-end',
  },
  bannerSubLabel: {
    color: '#BFDBFE',
    fontSize: 12,
  },
  bannerSubVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  courseRowCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseInput: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  controlLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  creditSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    borderRadius: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  creditNumber: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  gradeContainer: {
    marginTop: 2,
  },
  gradeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    marginRight: 6,
  },
  gradeChipSelected: {
    backgroundColor: '#2563EB',
  },
  gradeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  gradeChipTextSelected: {
    color: '#FFFFFF',
  },
  predictionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  predictLabel: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  predictValue: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
    marginVertical: 8,
  },
  predictSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 6,
  },
  numericInput: {
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
  },
});
