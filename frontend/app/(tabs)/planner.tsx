import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { AcademicAPI } from '@/src/api/academic';
import { Assignment, StudyLog, Semester, Course, AcademicProfile } from '@/src/types';
import {
  GRADE_SCALE,
  calculateGlobalStats,
  formatGpa,
  predictCgpa,
  predictBestWorstCase,
  requiredGradeForTarget,
  analyzeRetakes,
  simulateRetake,
  getGradePoints,
  truncateGpa,
  validCourse,
} from '@/src/lib/gpa';

const ASSIGNMENT_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'project', label: 'Project' },
];

function getCountdown(dueDate: string | null) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  if (diff < 0) return { text: 'Overdue', urgent: true, overdue: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { text: `${days}d ${hours}h left`, urgent: days <= 2, overdue: false };
  if (hours > 0) return { text: `${hours}h left`, urgent: true, overdue: false };
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { text: `${mins}m left`, urgent: true, overdue: false };
}

export default function PlannerScreen() {
  const { colors: theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'assignments' | 'study' | 'prediction' | 'retakes'>('assignments');
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [profile, setProfile] = useState<AcademicProfile | null>(null);

  // Sub-state for Assignments filter
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Sub-state for Retake Analyzer target grade
  const [retakeTargetGrade, setRetakeTargetGrade] = useState('B+');
  const [showRetakeGradePicker, setShowRetakeGradePicker] = useState(false);

  // Sub-state for Prediction
  const [hypotheticalCourses, setHypotheticalCourses] = useState<Course[]>([]);
  const [remainingCredits, setRemainingCredits] = useState(15);
  const [pickerCourseId, setPickerCourseId] = useState<string | null>(null);

  // Sub-state for Study log add modal
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newLogCourse, setNewLogCourse] = useState('');
  const [newLogHours, setNewLogHours] = useState('2');
  const [newLogNotes, setNewLogNotes] = useState('');

  const loadData = async () => {
    try {
      const [asgns, logs, sems, prof] = await Promise.all([
        AcademicAPI.getAssignments(),
        AcademicAPI.getStudyLogs(),
        AcademicAPI.getSemesters(),
        AcademicAPI.getProfile(),
      ]);
      setAssignments(asgns || []);
      setStudyLogs(logs || []);
      setSemesters(sems || []);
      setProfile(prof || null);
    } catch (e) {
      console.warn('Failed to load planner data:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ----------------------------------------------------
  // 1. ASSIGNMENTS OPERATIONS
  // ----------------------------------------------------
  const syncAssignments = async (updated: Assignment[]) => {
    setAssignments(updated);
    try {
      await AcademicAPI.saveAssignments(updated);
    } catch (e) {
      console.warn('Failed to sync assignments to backend');
    }
  };

  const addAssignment = () => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const newAsgn: Assignment = {
      id: `asgn-${Date.now()}`,
      title: '',
      courseName: '',
      type: 'assignment',
      dueDate: due.toISOString(),
      completed: false,
      notes: '',
    };
    syncAssignments([...assignments, newAsgn]);
  };

  const updateAssignment = (id: string, field: keyof Assignment, value: any) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, [field]: value } : a));
    syncAssignments(updated);
  };

  const toggleAssignmentComplete = (id: string) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a));
    syncAssignments(updated);
  };

  const removeAssignment = (id: string) => {
    syncAssignments(assignments.filter((a) => a.id !== id));
  };

  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === 'pending') return assignments.filter((a) => !a.completed);
    if (assignmentFilter === 'completed') return assignments.filter((a) => a.completed);
    return assignments;
  }, [assignments, assignmentFilter]);

  const pendingCount = assignments.filter((a) => !a.completed).length;
  const completedCount = assignments.filter((a) => a.completed).length;

  // ----------------------------------------------------
  // 2. STUDY LOGS OPERATIONS
  // ----------------------------------------------------
  const syncStudyLogs = async (updated: StudyLog[]) => {
    setStudyLogs(updated);
    try {
      await AcademicAPI.saveStudyLogs(updated);
    } catch (e) {
      console.warn('Failed to sync study logs to backend');
    }
  };

  const courseNamesList = useMemo(() => {
    const set = new Set<string>();
    (semesters || []).forEach((sem) => {
      (sem.courses || []).forEach((c) => {
        if (c.name && c.name.trim()) set.add(c.name.trim());
      });
    });
    return Array.from(set);
  }, [semesters]);

  const saveNewStudyLog = () => {
    const hours = parseFloat(newLogHours) || 1;
    const course = newLogCourse.trim() || courseNamesList[0] || 'General Study';
    const newEntry: StudyLog = {
      id: `log-${Date.now()}`,
      courseName: course,
      hours,
      logDate: new Date().toISOString().slice(0, 10),
      notes: newLogNotes.trim(),
    };
    syncStudyLogs([...studyLogs, newEntry]);
    setShowAddLogModal(false);
    setNewLogCourse('');
    setNewLogHours('2');
    setNewLogNotes('');
  };

  const removeStudyLog = (id: string) => {
    syncStudyLogs(studyLogs.filter((l) => l.id !== id));
  };

  const totalStudyHours = useMemo(() => {
    return studyLogs.reduce((sum, l) => sum + (parseFloat(String(l.hours)) || 0), 0);
  }, [studyLogs]);

  const studyHoursByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    studyLogs.forEach((l) => {
      const name = l.courseName || 'Other';
      map[name] = (map[name] || 0) + (parseFloat(String(l.hours)) || 0);
    });
    return Object.entries(map).map(([name, hours]) => ({
      name,
      hours: parseFloat(hours.toFixed(1)),
    })).sort((a, b) => b.hours - a.hours);
  }, [studyLogs]);

  // ----------------------------------------------------
  // 3. COURSE PREDICTION COMPUTATIONS
  // ----------------------------------------------------
  const inProgressFromSemesters = useMemo(() => {
    const list: Course[] = [];
    (semesters || []).forEach((sem) => {
      (sem.courses || []).forEach((c) => {
        if (c.status === 'in_progress' && c.name) {
          list.push(c);
        }
      });
    });
    return list;
  }, [semesters]);

  const completedSemesters = useMemo(() => {
    return (semesters || []).map((sem) => ({
      ...sem,
      courses: (sem.courses || []).filter((c) => c.status !== 'in_progress'),
    }));
  }, [semesters]);

  const activePredictionCourses =
    hypotheticalCourses.length > 0 ? hypotheticalCourses : inProgressFromSemesters;

  const prediction = predictCgpa(completedSemesters, activePredictionCourses);
  const bestWorst = predictBestWorstCase(completedSemesters, activePredictionCourses);
  const targetCgpaVal = profile?.targetCgpa ?? 3.5;
  const targetRequirement = requiredGradeForTarget(
    completedSemesters,
    remainingCredits,
    targetCgpaVal
  );

  const addHypotheticalCourse = () => {
    const newCourse: Course = {
      id: `hyp-${Date.now()}`,
      name: `Upcoming Course ${(hypotheticalCourses.length || 0) + 1}`,
      credits: 3,
      grade: 'B+',
      category: 'core',
      status: 'in_progress',
    };
    setHypotheticalCourses([...hypotheticalCourses, newCourse]);
  };

  const updateHypotheticalCourse = (id: string, field: keyof Course, value: any) => {
    const list = hypotheticalCourses.length > 0 ? hypotheticalCourses : inProgressFromSemesters;
    const updated = list.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    setHypotheticalCourses(updated);
  };

  const removeHypotheticalCourse = (id: string) => {
    setHypotheticalCourses(hypotheticalCourses.filter((c) => c.id !== id));
  };

  // ----------------------------------------------------
  // 4. RETAKE ANALYZER COMPUTATIONS
  // ----------------------------------------------------
  const retakeCandidates = useMemo(() => {
    return analyzeRetakes(semesters, retakeTargetGrade);
  }, [semesters, retakeTargetGrade]);

  const currentGlobalStats = useMemo(() => {
    return calculateGlobalStats(semesters);
  }, [semesters]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
    >
      {/* 4-Tab Segmented Selector */}
      <View style={[styles.tabBar, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'assignments' && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setActiveTab('assignments')}
        >
          <Ionicons
            name="calendar"
            size={14}
            color={activeTab === 'assignments' ? theme.tint : theme.textMuted}
          />
          <Text style={[styles.tabButtonText, { color: activeTab === 'assignments' ? theme.tint : theme.textMuted }]}>
            Assignments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'study' && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setActiveTab('study')}
        >
          <Ionicons
            name="time"
            size={14}
            color={activeTab === 'study' ? theme.tint : theme.textMuted}
          />
          <Text style={[styles.tabButtonText, { color: activeTab === 'study' ? theme.tint : theme.textMuted }]}>
            Study Time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'prediction' && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setActiveTab('prediction')}
        >
          <Ionicons
            name="sparkles"
            size={14}
            color={activeTab === 'prediction' ? theme.tint : theme.textMuted}
          />
          <Text style={[styles.tabButtonText, { color: activeTab === 'prediction' ? theme.tint : theme.textMuted }]}>
            Prediction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'retakes' && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => setActiveTab('retakes')}
        >
          <Ionicons
            name="refresh"
            size={14}
            color={activeTab === 'retakes' ? theme.tint : theme.textMuted}
          />
          <Text style={[styles.tabButtonText, { color: activeTab === 'retakes' ? theme.tint : theme.textMuted }]}>
            Retakes
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* SECTION 1: ASSIGNMENTS & EXAMS                            */}
      {/* ========================================================= */}
      {activeTab === 'assignments' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Assignments & Exams</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                {pendingCount} pending · {completedCount} completed
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButtonPrimary, { backgroundColor: theme.tint }]}
              onPress={addAssignment}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            {(['all', 'pending', 'completed'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  { borderColor: theme.border },
                  assignmentFilter === filter && { backgroundColor: theme.tint, borderColor: theme.tint },
                ]}
                onPress={() => setAssignmentFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: assignmentFilter === filter ? '#FFFFFF' : theme.textMuted },
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredAssignments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={36} color={theme.textMuted} style={{ opacity: 0.6 }} />
              <Text style={[styles.emptyCardTitle, { color: theme.text }]}>No assignments found</Text>
              <Text style={[styles.emptyCardSubtitle, { color: theme.textMuted }]}>
                Tap &ldquo;Add Item&rdquo; above to log your assignments, quizzes, and exams.
              </Text>
            </View>
          ) : (
            filteredAssignments.map((item) => {
              const countdown = getCountdown(item.dueDate);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.assignmentCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    item.completed && { opacity: 0.65 },
                  ]}
                >
                  <View style={styles.assignmentTopRow}>
                    <TouchableOpacity
                      onPress={() => toggleAssignmentComplete(item.id)}
                      style={styles.checkboxTouchable}
                    >
                      <Ionicons
                        name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={item.completed ? '#10B981' : theme.textMuted}
                      />
                    </TouchableOpacity>

                    <View style={styles.assignmentTitleCol}>
                      <TextInput
                        style={[styles.assignmentTitleInput, { color: theme.text }]}
                        value={item.title}
                        onChangeText={(t) => updateAssignment(item.id, 'title', t)}
                        placeholder="Task title (e.g. Midterm Exam)"
                        placeholderTextColor={theme.textMuted}
                      />
                      <TextInput
                        style={[styles.assignmentCourseInput, { color: theme.textMuted }]}
                        value={item.courseName}
                        onChangeText={(t) => updateAssignment(item.id, 'courseName', t)}
                        placeholder="Course Name"
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => removeAssignment(item.id)}
                      style={styles.deleteIconButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.assignmentBottomRow}>
                    {/* Type Tag */}
                    <View style={[styles.typeBadge, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                      <Text style={[styles.typeBadgeText, { color: theme.tint }]}>
                        {item.type ? item.type.toUpperCase() : 'ASSIGNMENT'}
                      </Text>
                    </View>

                    {/* Countdown Badge */}
                    {countdown && !item.completed && (
                      <View
                        style={[
                          styles.countdownBadge,
                          {
                            backgroundColor: countdown.overdue
                              ? '#FEE2E2'
                              : countdown.urgent
                              ? '#FEF3C7'
                              : theme.cardMuted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countdownBadgeText,
                            {
                              color: countdown.overdue
                                ? '#B91C1C'
                                : countdown.urgent
                                ? '#B45309'
                                : theme.text,
                            },
                          ]}
                        >
                          {countdown.text}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: STUDY TIME TRACKER                             */}
      {/* ========================================================= */}
      {activeTab === 'study' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Time Tracker</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                {totalStudyHours.toFixed(1)} total hours logged
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButtonPrimary, { backgroundColor: theme.tint }]}
              onPress={() => setShowAddLogModal(true)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>Log Session</Text>
            </TouchableOpacity>
          </View>

          {/* Overview Stat Card */}
          <View style={[styles.statBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statBannerCol}>
              <Text style={[styles.statBannerNumber, { color: theme.tint }]}>{totalStudyHours.toFixed(1)}h</Text>
              <Text style={[styles.statBannerLabel, { color: theme.textMuted }]}>Total Study Hours</Text>
            </View>
            <View style={styles.statBannerCol}>
              <Text style={[styles.statBannerNumber, { color: theme.text }]}>{studyLogs.length}</Text>
              <Text style={[styles.statBannerLabel, { color: theme.textMuted }]}>Sessions Logged</Text>
            </View>
            <View style={styles.statBannerCol}>
              <Text style={[styles.statBannerNumber, { color: theme.text }]}>{studyHoursByCourse.length}</Text>
              <Text style={[styles.statBannerLabel, { color: theme.textMuted }]}>Courses Covered</Text>
            </View>
          </View>

          {/* Distribution by Course */}
          {studyHoursByCourse.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>Hours by Course</Text>
              {studyHoursByCourse.map((item) => {
                const pct = totalStudyHours > 0 ? (item.hours / totalStudyHours) * 100 : 0;
                return (
                  <View key={item.name} style={styles.courseHourRow}>
                    <View style={styles.courseHourInfo}>
                      <Text style={[styles.courseHourName, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.courseHourValue, { color: theme.tint }]}>{item.hours} hrs</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.cardMuted }]}>
                      <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: theme.tint }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Session History */}
          <Text style={[styles.subSectionTitle, { color: theme.text }]}>Recent Study Sessions</Text>
          {studyLogs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="time-outline" size={36} color={theme.textMuted} style={{ opacity: 0.6 }} />
              <Text style={[styles.emptyCardTitle, { color: theme.text }]}>No study logs recorded</Text>
              <Text style={[styles.emptyCardSubtitle, { color: theme.textMuted }]}>
                Track your revision sessions to stay organized throughout the semester.
              </Text>
            </View>
          ) : (
            studyLogs.map((log) => (
              <View
                key={log.id}
                style={[styles.studyLogRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.studyLogInfo}>
                  <Text style={[styles.studyLogCourse, { color: theme.text }]}>{log.courseName}</Text>
                  <Text style={[styles.studyLogDate, { color: theme.textMuted }]}>
                    {log.logDate} {log.notes ? `· ${log.notes}` : ''}
                  </Text>
                </View>
                <View style={styles.studyLogRight}>
                  <Text style={[styles.studyLogHours, { color: theme.tint }]}>{log.hours}h</Text>
                  <TouchableOpacity onPress={() => removeStudyLog(log.id)} style={styles.deleteIconButton}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: COURSE PREDICTION & TARGET GPA                 */}
      {/* ========================================================= */}
      {activeTab === 'prediction' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Course Prediction</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                Test expected grades to forecast your future CGPA
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButtonPrimary, { backgroundColor: theme.tint }]}
              onPress={addHypotheticalCourse}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>Add Course</Text>
            </TouchableOpacity>
          </View>

          {/* Prediction Result Cards */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Current CGPA</Text>
              <Text style={[styles.kpiValue, { color: theme.text }]}>
                {formatGpa(prediction.currentCgpa)}
              </Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Predicted CGPA</Text>
              <Text style={[styles.kpiValue, { color: theme.tint }]}>
                {formatGpa(prediction.predictedCgpa)}
              </Text>
            </View>
          </View>

          {/* Best / Worst Range */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 8 }]}>Forecast Range</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeCol}>
                <Text style={[styles.rangeLabel, { color: '#10B981' }]}>Best Case (All A+)</Text>
                <Text style={[styles.rangeValue, { color: '#10B981' }]}>{formatGpa(bestWorst.best)}</Text>
              </View>
              <View style={styles.rangeCol}>
                <Text style={[styles.rangeLabel, { color: '#EF4444' }]}>Worst Case (All F)</Text>
                <Text style={[styles.rangeValue, { color: '#EF4444' }]}>{formatGpa(bestWorst.worst)}</Text>
              </View>
            </View>
          </View>

          {/* Target Requirement Card */}
          {targetRequirement && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 6 }]}>Target CGPA Goal</Text>
              <Text style={[styles.targetDesc, { color: theme.textMuted }]}>
                To reach your target CGPA of <Text style={{ color: theme.tint, fontWeight: '700' }}>{targetCgpaVal.toFixed(2)}</Text> with {remainingCredits} credits remaining:
              </Text>
              <View style={[styles.targetHighlightBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                {targetRequirement.possible ? (
                  <Text style={[styles.targetHighlightText, { color: '#10B981' }]}>
                    Required Average Grade: {targetRequirement.letter} ({targetRequirement.requiredGpa.toFixed(2)})
                  </Text>
                ) : (
                  <Text style={[styles.targetHighlightText, { color: '#EF4444' }]}>
                    Mathematically unreachable within {remainingCredits} remaining credits.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Hypothetical Course List */}
          <Text style={[styles.subSectionTitle, { color: theme.text }]}>Hypothetical / Current Courses</Text>
          {activePredictionCourses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="sparkles-outline" size={36} color={theme.textMuted} style={{ opacity: 0.6 }} />
              <Text style={[styles.emptyCardTitle, { color: theme.text }]}>No courses in prediction</Text>
              <Text style={[styles.emptyCardSubtitle, { color: theme.textMuted }]}>
                Tap &ldquo;Add Course&rdquo; above to test expected grades.
              </Text>
            </View>
          ) : (
            activePredictionCourses.map((c) => (
              <View
                key={c.id}
                style={[styles.predictionCourseCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.predCourseTop}>
                  <TextInput
                    style={[styles.predCourseNameInput, { color: theme.text }]}
                    value={c.name}
                    onChangeText={(val) => updateHypotheticalCourse(c.id, 'name', val)}
                    placeholder="Course name"
                    placeholderTextColor={theme.textMuted}
                  />
                  <TouchableOpacity
                    onPress={() => removeHypotheticalCourse(c.id)}
                    style={styles.deleteIconButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.predCourseControls}>
                  {/* Credits input */}
                  <View style={styles.predControlGroup}>
                    <Text style={[styles.predControlLabel, { color: theme.textMuted }]}>Credits</Text>
                    <TextInput
                      style={[styles.predCreditInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardMuted }]}
                      keyboardType="numeric"
                      value={String(c.credits)}
                      onChangeText={(val) => updateHypotheticalCourse(c.id, 'credits', parseInt(val, 10) || 0)}
                    />
                  </View>

                  {/* Grade Selector */}
                  <View style={styles.predControlGroup}>
                    <Text style={[styles.predControlLabel, { color: theme.textMuted }]}>Expected Grade</Text>
                    <TouchableOpacity
                      style={[styles.predGradePickerBtn, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}
                      onPress={() => setPickerCourseId(c.id)}
                    >
                      <Text style={[styles.predGradePickerText, { color: theme.tint }]}>
                        {c.grade || 'B+'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: RETAKE ANALYZER                                */}
      {/* ========================================================= */}
      {activeTab === 'retakes' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Retake Analyzer</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                Courses with grade &lt; 2.0 (C) eligible for retake
              </Text>
            </View>
          </View>

          {/* Target Grade Selector */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.retakeTargetRow}>
              <Text style={[styles.retakeTargetLabel, { color: theme.text }]}>Retake Target Grade:</Text>
              <TouchableOpacity
                style={[styles.retakeTargetBtn, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}
                onPress={() => setShowRetakeGradePicker(true)}
              >
                <Text style={[styles.retakeTargetBtnText, { color: theme.tint }]}>{retakeTargetGrade}</Text>
                <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {retakeCandidates.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" style={{ opacity: 0.8 }} />
              <Text style={[styles.emptyCardTitle, { color: theme.text }]}>No Retake Candidates</Text>
              <Text style={[styles.emptyCardSubtitle, { color: theme.textMuted }]}>
                Great news! You have no failed courses (grade &lt; 2.0) recorded in your semesters.
              </Text>
            </View>
          ) : (
            retakeCandidates.map((item, index) => {
              const projected = simulateRetake(semesters, item.courseId, retakeTargetGrade);
              const isHighest = index === 0;
              return (
                <View
                  key={item.courseId}
                  style={[
                    styles.retakeCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: isHighest ? theme.tint : theme.border,
                      borderWidth: isHighest ? 1.5 : 1,
                    },
                  ]}
                >
                  {isHighest && (
                    <View style={[styles.highestBadge, { backgroundColor: theme.tint }]}>
                      <Text style={styles.highestBadgeText}>HIGHEST IMPACT</Text>
                    </View>
                  )}
                  <View style={styles.retakeCardTop}>
                    <View>
                      <Text style={[styles.retakeCourseName, { color: theme.text }]}>{item.courseName}</Text>
                      <Text style={[styles.retakeSemesterText, { color: theme.textMuted }]}>
                        {item.semester} · {item.credits} credits
                      </Text>
                    </View>
                    <View style={styles.retakeLiftCol}>
                      <Text style={[styles.retakeGradeTransition, { color: theme.textMuted }]}>
                        {item.oldLetter} → {item.newLetter}
                      </Text>
                      <Text style={[styles.retakeLiftVal, { color: '#10B981' }]}>
                        +{formatGpa(item.cgpaLift)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.retakeExplText, { color: theme.textMuted, borderTopColor: theme.border }]}>
                    Retaking <Text style={{ fontWeight: '700', color: theme.text }}>{item.courseName}</Text> from{' '}
                    {item.oldLetter} to {item.newLetter} increases CGPA from{' '}
                    {formatGpa(currentGlobalStats.cgpa)} to{' '}
                    <Text style={{ fontWeight: '700', color: theme.tint }}>{formatGpa(projected)}</Text>.
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Grade Picker Modal for Prediction */}
      <Modal visible={pickerCourseId !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.pickerModalTitle, { color: theme.text }]}>Select Expected Grade</Text>
            <View style={styles.gradeGrid}>
              {GRADE_SCALE.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.gradeGridBtn, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                  onPress={() => {
                    if (pickerCourseId) {
                      updateHypotheticalCourse(pickerCourseId, 'grade', g.value);
                    }
                    setPickerCourseId(null);
                  }}
                >
                  <Text style={[styles.gradeGridBtnText, { color: theme.text }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: theme.border }]}
              onPress={() => setPickerCourseId(null)}
            >
              <Text style={[styles.modalCloseBtnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Retake Target Grade Picker Modal */}
      <Modal visible={showRetakeGradePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.pickerModalTitle, { color: theme.text }]}>Select Target Grade</Text>
            <View style={styles.gradeGrid}>
              {GRADE_SCALE.filter((g) => g.points >= 2.0).map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.gradeGridBtn, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}
                  onPress={() => {
                    setRetakeTargetGrade(g.value);
                    setShowRetakeGradePicker(false);
                  }}
                >
                  <Text style={[styles.gradeGridBtnText, { color: theme.text }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: theme.border }]}
              onPress={() => setShowRetakeGradePicker(false)}
            >
              <Text style={[styles.modalCloseBtnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Study Log Modal */}
      <Modal visible={showAddLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.addLogModalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.pickerModalTitle, { color: theme.text }]}>Log Study Session</Text>
            
            <Text style={[styles.modalFieldLabel, { color: theme.textMuted }]}>Course Name</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardMuted }]}
              placeholder="e.g. Applied Mathematics II"
              placeholderTextColor={theme.textMuted}
              value={newLogCourse}
              onChangeText={setNewLogCourse}
            />

            <Text style={[styles.modalFieldLabel, { color: theme.textMuted }]}>Hours Spent</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardMuted }]}
              placeholder="2.5"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={newLogHours}
              onChangeText={setNewLogHours}
            />

            <Text style={[styles.modalFieldLabel, { color: theme.textMuted }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardMuted }]}
              placeholder="Chapter 4 exercises, Quiz prep"
              placeholderTextColor={theme.textMuted}
              value={newLogNotes}
              onChangeText={setNewLogNotes}
            />

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { borderColor: theme.border }]}
                onPress={() => setShowAddLogModal(false)}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: theme.tint }]}
                onPress={saveNewStudyLog}
              >
                <Text style={styles.modalPrimaryBtnText}>Save Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assignmentCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  assignmentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxTouchable: {
    marginTop: 2,
  },
  assignmentTitleCol: {
    flex: 1,
    gap: 2,
  },
  assignmentTitleInput: {
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  assignmentCourseInput: {
    fontSize: 12,
    padding: 0,
  },
  deleteIconButton: {
    padding: 4,
  },
  assignmentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyCardSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  statBanner: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  statBannerCol: {
    alignItems: 'center',
  },
  statBannerNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  statBannerLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  courseHourRow: {
    marginBottom: 10,
  },
  courseHourInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  courseHourName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  courseHourValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  studyLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  studyLogInfo: {
    flex: 1,
  },
  studyLogCourse: {
    fontSize: 13,
    fontWeight: '700',
  },
  studyLogDate: {
    fontSize: 11,
    marginTop: 2,
  },
  studyLogRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studyLogHours: {
    fontSize: 14,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  rangeCol: {
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  targetDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  targetHighlightBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  targetHighlightText: {
    fontSize: 12,
    fontWeight: '800',
  },
  predictionCourseCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  predCourseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predCourseNameInput: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    padding: 0,
  },
  predCourseControls: {
    flexDirection: 'row',
    gap: 12,
  },
  predControlGroup: {
    flex: 1,
    gap: 4,
  },
  predControlLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  predCreditInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  predGradePickerBtn: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predGradePickerText: {
    fontSize: 13,
    fontWeight: '800',
  },
  retakeTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retakeTargetLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  retakeTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  retakeTargetBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  retakeCard: {
    borderRadius: 14,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  highestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  highestBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  retakeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  retakeCourseName: {
    fontSize: 14,
    fontWeight: '800',
  },
  retakeSemesterText: {
    fontSize: 11,
    marginTop: 2,
  },
  retakeLiftCol: {
    alignItems: 'flex-end',
  },
  retakeGradeTransition: {
    fontSize: 11,
    fontWeight: '600',
  },
  retakeLiftVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  retakeExplText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 14,
  },
  gradeGridBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  gradeGridBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalCloseBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addLogModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 6,
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  modalInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
