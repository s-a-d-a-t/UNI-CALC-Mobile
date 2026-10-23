import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { AcademicAPI } from '@/src/api/academic';
import {
  calculateGlobalStats,
  calculateSemesterStats,
  getGraduationStats,
  getGradeDistributionData,
  getPassFailStats,
  getStrongestWeakestSemesters,
  requiredGradeForTarget,
  formatGpa,
  GRADE_COLORS,
} from '@/src/lib/gpa';
import { AcademicProfile, Semester, User } from '@/src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark, colors: theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'graduation'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AcademicProfile>({
    name: 'Student',
    studentId: '',
    major: 'General Studies',
    targetCgpa: 3.5,
    graduationCredits: 145,
    coreCreditsRequired: 100,
    electiveCreditsRequired: 45,
  });
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const loadData = async () => {
    try {
      const [currentUser, userProfile, userSemesters] = await Promise.all([
        AcademicAPI.getSession(),
        AcademicAPI.getProfile(),
        AcademicAPI.getSemesters(),
      ]);
      if (currentUser) setUser(currentUser);
      if (userProfile) setProfile(userProfile);
      if (userSemesters) setSemesters(userSemesters);
    } catch (e) {
      console.warn('Dashboard loadData fallback:', e);
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

  // Live academic calculations (identical to web app)
  const globalStats = calculateGlobalStats(semesters);
  const gradStats = getGraduationStats(semesters, profile);
  const gradeDist = getGradeDistributionData(semesters);
  const passFail = getPassFailStats(semesters);
  const strongestWeakest = getStrongestWeakestSemesters(semesters);

  const recentSemester = semesters.length > 0 ? semesters[semesters.length - 1] : null;
  const recentSemesterStats = recentSemester ? calculateSemesterStats(recentSemester.courses) : null;

  const targetAnalysis = requiredGradeForTarget(
    semesters,
    gradStats.remainingCredits,
    profile.targetCgpa || 3.5
  );

  const getStandingBadge = (cgpa: number) => {
    if (cgpa >= 3.8) return { label: "Dean's Honor", color: '#10B981', bg: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' };
    if (cgpa >= 3.5) return { label: 'First Class Distinction', color: theme.tint, bg: theme.badgeBg };
    if (cgpa >= 3.0) return { label: 'Distinction', color: theme.tint, bg: theme.badgeBg };
    if (cgpa >= 2.5) return { label: 'Satisfactory', color: '#6B7280', bg: isDark ? '#21262D' : '#F3F4F6' };
    if (cgpa >= 2.0) return { label: 'Academic Warning', color: '#F59E0B', bg: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' };
    return { label: 'Dismissal Risk', color: '#EF4444', bg: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' };
  };

  const standing = getStandingBadge(globalStats.cgpa);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
      }>
      
      {/* Sub-tab Navigation (Overview / Analytics / Graduation) */}
      <View style={[styles.subTabContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('overview')}
          style={[
            styles.subTabBtn,
            activeTab === 'overview' && [styles.subTabBtnActive, { borderBottomColor: theme.tint }],
          ]}>
          <Ionicons
            name="bar-chart-outline"
            size={16}
            color={activeTab === 'overview' ? theme.tint : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeTab === 'overview' ? theme.tint : theme.textMuted },
              activeTab === 'overview' && styles.subTabTextActive,
            ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          style={[
            styles.subTabBtn,
            activeTab === 'analytics' && [styles.subTabBtnActive, { borderBottomColor: theme.tint }],
          ]}>
          <Ionicons
            name="trending-up-outline"
            size={16}
            color={activeTab === 'analytics' ? theme.tint : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeTab === 'analytics' ? theme.tint : theme.textMuted },
              activeTab === 'analytics' && styles.subTabTextActive,
            ]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('graduation')}
          style={[
            styles.subTabBtn,
            activeTab === 'graduation' && [styles.subTabBtnActive, { borderBottomColor: theme.tint }],
          ]}>
          <Ionicons
            name="school-outline"
            size={16}
            color={activeTab === 'graduation' ? theme.tint : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeTab === 'graduation' ? theme.tint : theme.textMuted },
              activeTab === 'graduation' && styles.subTabTextActive,
            ]}>
            Graduation
          </Text>
        </TouchableOpacity>
      </View>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Top 4 KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            {/* Card 1: Cumulative CGPA */}
            <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Cumulative CGPA</Text>
              <Text style={[styles.kpiValue, { color: theme.text }]}>
                {formatGpa(globalStats.cgpa)}
              </Text>
              <View style={[styles.kpiFooter, { borderTopColor: theme.border }]}>
                <Text style={[styles.kpiSubtext, { color: theme.textMuted }]}>Out of 4.00 Scale</Text>
              </View>
            </View>

            {/* Card 2: Credits Completed */}
            <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Credits Completed</Text>
              <Text style={[styles.kpiValue, { color: theme.text }]}>
                {gradStats.totalCredits}{' '}
                <Text style={[styles.kpiValueSmall, { color: theme.textMuted }]}>
                  / {gradStats.gradGoal}
                </Text>
              </Text>
              <View style={styles.kpiProgressContainer}>
                <View style={styles.kpiProgressHeader}>
                  <Text style={[styles.kpiProgressLabel, { color: theme.textMuted }]}>Degree Progress</Text>
                  <Text style={[styles.kpiProgressLabel, { color: theme.tint, fontWeight: '800' }]}>
                    {gradStats.progressPercent}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.cardMuted }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { backgroundColor: theme.tint, width: `${gradStats.progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Card 3: Recent Term GPA */}
            <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Recent Term GPA</Text>
              <View style={styles.recentGpaRow}>
                <Text style={[styles.kpiValue, { color: theme.text }]}>
                  {recentSemesterStats ? formatGpa(recentSemesterStats.gpa) : '—'}
                </Text>
                {recentSemesterStats && recentSemesterStats.gpa >= globalStats.cgpa ? (
                  <View style={[styles.trendBadge, { backgroundColor: theme.successBg }]}>
                    <Ionicons name="arrow-up" size={12} color={theme.success} />
                  </View>
                ) : (
                  <View style={[styles.trendBadge, { backgroundColor: theme.dangerBg }]}>
                    <Ionicons name="arrow-down" size={12} color={theme.danger} />
                  </View>
                )}
              </View>
              <View style={[styles.kpiFooter, { borderTopColor: theme.border }]}>
                <Text style={[styles.kpiSubtext, { color: theme.textMuted }]}>
                  {recentSemester?.description || 'No term records yet'}
                </Text>
              </View>
            </View>

            {/* Card 4: Academic Standing */}
            <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Academic Standing</Text>
              <View style={[styles.standingBadge, { backgroundColor: standing.bg }]}>
                <Ionicons name="ribbon" size={14} color={standing.color} style={{ marginRight: 6 }} />
                <Text style={[styles.standingBadgeText, { color: standing.color }]}>
                  {standing.label}
                </Text>
              </View>
              <View style={[styles.kpiFooter, { borderTopColor: theme.border }]}>
                <Text style={[styles.kpiSubtext, { color: theme.textMuted }]}>
                  {globalStats.cgpa >= 2.0 ? 'Official Good Standing' : 'Academic Probation'}
                </Text>
              </View>
            </View>
          </View>

          {/* Grade Distribution Section */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                <Ionicons name="pie-chart-outline" size={18} color={theme.tint} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Grade Distribution</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                  Letter grade frequency and earned credits
                </Text>
              </View>
            </View>

            {gradeDist.length > 0 ? (
              <View style={styles.gradeGrid}>
                {gradeDist.map((item) => (
                  <View
                    key={item.name}
                    style={[styles.gradeItem, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                    <View style={styles.gradeItemHeader}>
                      <View
                        style={[
                          styles.gradeColorDot,
                          { backgroundColor: GRADE_COLORS[item.name] || theme.tint },
                        ]}
                      />
                      <Text style={[styles.gradeLetter, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.gradePts, { color: theme.textMuted }]}>
                        ({item.points.toFixed(2)})
                      </Text>
                    </View>
                    <Text style={[styles.gradeCount, { color: theme.text }]}>
                      {item.courses} {item.courses === 1 ? 'course' : 'courses'}
                    </Text>
                    <Text style={[styles.gradeCredits, { color: theme.textMuted }]}>
                      {item.credits} hrs ({item.creditPct}%)
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyNotice, { color: theme.textMuted }]}>
                No course grades entered yet. Add courses in the Calculator tab to view distribution curves.
              </Text>
            )}
          </View>

          {/* Pass vs. Fail Breakdown */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.tint} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Course Pass vs. Fail</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                  Credit completion integrity metrics
                </Text>
              </View>
            </View>

            <View style={styles.passFailRow}>
              <View style={[styles.passFailCol, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <Text style={[styles.passFailLabel, { color: theme.textMuted }]}>PASSED</Text>
                <Text style={[styles.passFailValue, { color: '#10B981' }]}>
                  {passFail.passedCourses} Courses
                </Text>
                <Text style={[styles.passFailSub, { color: theme.textMuted }]}>
                  {passFail.passedCredits} Credits ({passFail.passRateCourses}%)
                </Text>
              </View>

              <View style={[styles.passFailCol, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <Text style={[styles.passFailLabel, { color: theme.textMuted }]}>FAILED / RETAKE</Text>
                <Text style={[styles.passFailValue, { color: '#EF4444' }]}>
                  {passFail.failedCourses} Courses
                </Text>
                <Text style={[styles.passFailSub, { color: theme.textMuted }]}>
                  {passFail.failedCredits} Credits
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <View style={styles.tabContent}>
          {/* Strongest & Weakest Semesters */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>
              Semester Performance Highlights
            </Text>

            <View style={styles.highlightRow}>
              {/* Strongest */}
              <View style={[styles.highlightCol, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text style={[styles.highlightHeaderTitle, { color: '#10B981' }]}>Highest Term</Text>
                </View>
                <Text style={[styles.highlightSemName, { color: theme.text }]}>
                  {strongestWeakest.strongest?.name || 'No term data'}
                </Text>
                <Text style={[styles.highlightGpa, { color: theme.tint }]}>
                  {strongestWeakest.strongest ? formatGpa(strongestWeakest.strongest.GPA) : '—'} GPA
                </Text>
                <Text style={[styles.highlightCredits, { color: theme.textMuted }]}>
                  {strongestWeakest.strongest ? `${strongestWeakest.strongest.Credits} credit hours` : ''}
                </Text>
              </View>

              {/* Weakest */}
              <View style={[styles.highlightCol, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="trending-down" size={16} color="#EF4444" />
                  <Text style={[styles.highlightHeaderTitle, { color: '#EF4444' }]}>Lowest Term</Text>
                </View>
                <Text style={[styles.highlightSemName, { color: theme.text }]}>
                  {strongestWeakest.weakest?.name || 'No term data'}
                </Text>
                <Text style={[styles.highlightGpa, { color: '#EF4444' }]}>
                  {strongestWeakest.weakest ? formatGpa(strongestWeakest.weakest.GPA) : '—'} GPA
                </Text>
                <Text style={[styles.highlightCredits, { color: theme.textMuted }]}>
                  {strongestWeakest.weakest ? `${strongestWeakest.weakest.Credits} credit hours` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 14 }]}>Academic Stats</Text>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total Semesters Logged</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{semesters.length} terms</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Total Points Earned</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{globalStats.totalPoints} pts</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Target CGPA Gap</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: globalStats.cgpa >= profile.targetCgpa ? '#10B981' : theme.tint },
                ]}>
                {globalStats.cgpa >= profile.targetCgpa
                  ? 'Goal Exceeded'
                  : `-${(profile.targetCgpa - globalStats.cgpa).toFixed(2)} to target`}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* GRADUATION ROADMAP TAB */}
      {activeTab === 'graduation' && (
        <View style={styles.tabContent}>
          {/* Target Honour Roadmap Card */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                <Ionicons name="trophy-outline" size={18} color={theme.tint} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Target Honour Forecast</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>
                  Goal: {profile.targetCgpa.toFixed(2)} CGPA Honours
                </Text>
              </View>
            </View>

            {targetAnalysis ? (
              <View style={[styles.targetBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <Text style={[styles.targetBoxLabel, { color: theme.textMuted }]}>
                  REQUIRED FUTURE AVERAGE GPA
                </Text>
                <Text
                  style={[
                    styles.targetBoxValue,
                    { color: targetAnalysis.possible ? theme.tint : '#EF4444' },
                  ]}>
                  {targetAnalysis.possible
                    ? targetAnalysis.requiredGpa <= 0
                      ? 'Goal Already Secured'
                      : `${targetAnalysis.requiredGpa.toFixed(2)} GPA`
                    : 'Goal Requires > 4.00 (Exceeds Scale)'}
                </Text>
                <Text style={[styles.targetBoxDesc, { color: theme.textMuted }]}>
                  {targetAnalysis.possible
                    ? `Maintain an average of ~${targetAnalysis.letter || targetAnalysis.requiredGpa.toFixed(2)} across your remaining ${gradStats.remainingCredits} credit hours to achieve your target graduation honours.`
                    : 'To reach your target CGPA, you would need higher points than a 4.00 max scale. Consider retaking low-grade courses to boost your base CGPA.'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Core vs. Elective Credits Breakdown */}
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 14 }]}>
              Degree Credit Load Breakdown
            </Text>

            {/* Core */}
            <View style={styles.creditBarBlock}>
              <View style={styles.creditBarHeader}>
                <Text style={[styles.creditBarLabel, { color: theme.text }]}>Core Major Credits</Text>
                <Text style={[styles.creditBarValue, { color: theme.textMuted }]}>
                  {gradStats.coreCredits} / {gradStats.coreRequired} hrs
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: theme.cardMuted }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: theme.tint,
                      width: `${Math.min(
                        Math.round((gradStats.coreCredits / gradStats.coreRequired) * 100),
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Elective */}
            <View style={styles.creditBarBlock}>
              <View style={styles.creditBarHeader}>
                <Text style={[styles.creditBarLabel, { color: theme.text }]}>Elective Credits</Text>
                <Text style={[styles.creditBarValue, { color: theme.textMuted }]}>
                  {gradStats.electiveCredits} / {gradStats.electiveRequired} hrs
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: theme.cardMuted }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#3B82F6',
                      width: `${Math.min(
                        Math.round((gradStats.electiveCredits / gradStats.electiveRequired) * 100),
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Remaining Summary */}
            <View style={[styles.remainingPill, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
              <Text style={[styles.remainingText, { color: theme.textMuted }]}>
                {gradStats.remainingCredits} total credits remaining until degree completion.
              </Text>
            </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  subTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {},
  subTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subTabTextActive: {
    fontWeight: '900',
  },
  tabContent: {
    gap: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  kpiValueSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiFooter: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 4,
  },
  kpiSubtext: {
    fontSize: 10,
    fontWeight: '600',
  },
  kpiProgressContainer: {
    marginTop: 4,
  },
  kpiProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiProgressLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recentGpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  standingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  standingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeItem: {
    width: (Dimensions.get('window').width - 72) / 3,
    maxWidth: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  gradeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  gradeColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gradeLetter: {
    fontSize: 12,
    fontWeight: '800',
  },
  gradePts: {
    fontSize: 10,
    fontWeight: '600',
  },
  gradeCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  gradeCredits: {
    fontSize: 9,
    fontWeight: '500',
  },
  emptyNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  passFailRow: {
    flexDirection: 'row',
    gap: 10,
  },
  passFailCol: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  passFailLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  passFailValue: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  passFailSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightCol: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  highlightHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  highlightSemName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  highlightGpa: {
    fontSize: 18,
    fontWeight: '900',
  },
  highlightCredits: {
    fontSize: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  targetBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  targetBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  targetBoxValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  targetBoxDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  creditBarBlock: {
    marginBottom: 12,
  },
  creditBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  creditBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  creditBarValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  remainingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
