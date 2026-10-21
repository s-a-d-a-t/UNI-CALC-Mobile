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
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Placeholder initial state (will link to API/Cache in next steps)
  const [profile] = useState({
    name: 'Sadat',
    department: 'Computer Science',
    cgpa: 3.65,
    targetCgpa: 3.80,
    totalCreditsEarned: 68,
    totalCreditsRequired: 120,
    activeSemester: 'Fall 2025',
    activeCoursesCount: 5,
    currentSemesterGpa: 3.72,
  });

  const getStandingBadge = (cgpa: number) => {
    if (cgpa >= 3.8) return { label: "Dean's Honor", color: '#10B981', bg: '#D1FAE5' };
    if (cgpa >= 3.5) return { label: 'First Class', color: '#2563EB', bg: '#DBEAFE' };
    if (cgpa >= 3.0) return { label: 'Good Standing', color: '#F59E0B', bg: '#FEF3C7' };
    return { label: 'Academic Warning', color: '#EF4444', bg: '#FEE2E2' };
  };

  const standing = getStandingBadge(profile.cgpa);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]}
      contentContainerStyle={styles.contentContainer}>
      
      {/* Header Welcome */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeSub, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
            Welcome back,
          </Text>
          <Text style={[styles.welcomeName, { color: theme.text }]}>
            {profile.name}
          </Text>
        </View>
        <View style={[styles.deptPill, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]}>
          <Text style={[styles.deptText, { color: theme.text }]}>
            {profile.department}
          </Text>
        </View>
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

        <Text style={styles.cgpaNumber}>{profile.cgpa.toFixed(2)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Credits Earned</Text>
            <Text style={styles.statValue}>
              {profile.totalCreditsEarned} / {profile.totalCreditsRequired}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Target CGPA</Text>
            <Text style={styles.statValue}>{profile.targetCgpa.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Active Semester Overview */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Semester</Text>
      <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.semesterRow}>
          <View>
            <Text style={[styles.semesterName, { color: theme.text }]}>{profile.activeSemester}</Text>
            <Text style={styles.semesterMeta}>{profile.activeCoursesCount} Courses Enrolled</Text>
          </View>
          <View style={styles.semesterGpaPill}>
            <Text style={styles.semesterGpaLabel}>Term GPA</Text>
            <Text style={styles.semesterGpaVal}>{profile.currentSemesterGpa.toFixed(2)}</Text>
          </View>
        </View>
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
          <Text style={[styles.actionTitle, { color: theme.text }]}>Target GPA</Text>
          <Text style={styles.actionSubtitle}>Predict needed grades</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}
          onPress={() => router.push('/(tabs)/planner')}>
          <View style={[styles.actionIconBox, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="book" size={24} color="#10B981" />
          </View>
          <Text style={[styles.actionTitle, { color: theme.text }]}>Plan Courses</Text>
          <Text style={styles.actionSubtitle}>Manage semesters</Text>
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
    backgroundColor: '#1E3A8A', // Deep navy royal
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
