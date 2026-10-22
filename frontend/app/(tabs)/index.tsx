import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { AcademicAPI } from '@/src/api/academic';
import { calculateGlobalStats, calculateSemesterStats } from '@/src/lib/gpa';
import { AcademicProfile, Semester, User } from '@/src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

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
      console.warn('Offline or server not reachable:', e);
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

  // Compute live GPA stats using our accurate engine
  const globalStats = calculateGlobalStats(semesters);
  const activeSemester = semesters.length > 0 ? semesters[semesters.length - 1] : null;
  const activeSemesterStats = activeSemester ? calculateSemesterStats(activeSemester.courses) : null;

  const getStandingBadge = (cgpa: number) => {
    if (cgpa >= 3.8) return { label: "Dean's Honor", color: '#10B981', bg: '#D1FAE5' };
    if (cgpa >= 3.5) return { label: 'First Class', color: '#2563EB', bg: '#DBEAFE' };
    if (cgpa >= 3.0) return { label: 'Good Standing', color: '#F59E0B', bg: '#FEF3C7' };
    return { label: 'Academic Warning', color: '#EF4444', bg: '#FEE2E2' };
  };

  const standing = getStandingBadge(globalStats.cgpa);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      
      {/* Header Welcome & Sync Status */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeSub, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
            {user ? 'Logged in as' : 'Welcome to Uni-Calc,'}
          </Text>
          <Text style={[styles.welcomeName, { color: theme.text }]}>
            {profile.name || user?.name || 'Guest Student'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.deptPill, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]}
          onPress={() => router.push('/modal')}>
          <Text style={[styles.deptText, { color: theme.text }]}>
            {user ? '● Synced' : 'Sync Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Primary CGPA Highlight Card */}
      <View style={styles.cgpaCard}>
        <View style={styles.cgpaHeader}>
          <Text style={styles.cgpaLabel}>CUMULATIVE GPA</Text>
          <View style={[styles.badge, { backgroundColor: standing.bg }]}>
            <Text style={[styles.badgeText, { color: standing.color }]}>
              {standing.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cgpaNumber}>{globalStats.cgpa.toFixed(2)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Credits Earned</Text>
            <Text style={styles.statValue}>
              {globalStats.totalCredits} / {profile.graduationCredits || 145}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Target CGPA</Text>
            <Text style={styles.statValue}>{(profile.targetCgpa || 3.5).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Active Semester Overview */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Term</Text>
      <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}>
        {activeSemester ? (
          <View style={styles.semesterRow}>
            <View>
              <Text style={[styles.semesterName, { color: theme.text }]}>
                {activeSemester.description || `Semester ${activeSemester.number}`}
              </Text>
              <Text style={styles.semesterMeta}>
                {activeSemester.courses?.length || 0} Courses Enrolled
              </Text>
            </View>
            <View style={styles.semesterGpaPill}>
              <Text style={styles.semesterGpaLabel}>Term GPA</Text>
              <Text style={styles.semesterGpaVal}>
                {(activeSemesterStats?.gpa || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ color: '#6B7280' }}>No semesters recorded yet. Add one in Planner.</Text>
        )}
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}
          onPress={() => router.push('/(tabs)/calculator')}>
          <View style={[styles.actionIconBox, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="calculator" size={24} color="#2563EB" />
          </View>
          <Text style={[styles.actionTitle, { color: theme.text }]}>Predictor</Text>
          <Text style={styles.actionSubtitle}>Target GPA needed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}
          onPress={() => router.push('/(tabs)/planner')}>
          <View style={[styles.actionIconBox, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="school" size={24} color="#10B981" />
          </View>
          <Text style={[styles.actionTitle, { color: theme.text }]}>Semesters</Text>
          <Text style={styles.actionSubtitle}>Manage courses</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: '700',
  },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deptText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cgpaCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cgpaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cgpaLabel: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cgpaNumber: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 14,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
  },
  statLabel: {
    color: '#BFDBFE',
    fontSize: 12,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  semesterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '700',
  },
  semesterMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  semesterGpaPill: {
    alignItems: 'flex-end',
  },
  semesterGpaLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  semesterGpaVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
