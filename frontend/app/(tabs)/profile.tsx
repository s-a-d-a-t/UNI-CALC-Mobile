import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { API_BASE_URL } from '@/src/api/client';
import { AcademicAPI } from '@/src/api/academic';
import { LocalCache, TokenStorage } from '@/src/lib/storage';
import { AcademicProfile, User } from '@/src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AcademicProfile>({
    name: 'Student',
    studentId: '',
    major: '',
    targetCgpa: 3.5,
    graduationCredits: 145,
    coreCreditsRequired: 100,
    electiveCreditsRequired: 45,
  });

  const loadProfile = async () => {
    try {
      const [currentUser, userProfile] = await Promise.all([
        AcademicAPI.getSession(),
        AcademicAPI.getProfile(),
      ]);
      if (currentUser) setUser(currentUser);
      if (userProfile) setProfile(userProfile);
    } catch (e) {
      console.warn('Failed to load profile:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleUpdateTarget = async (newVal: string) => {
    const num = parseFloat(newVal);
    if (!isNaN(num)) {
      setProfile((prev) => ({ ...prev, targetCgpa: num }));
      try {
        await AcademicAPI.updateProfile({ targetCgpa: num });
      } catch (e) {}
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Offline Cache',
      'This will remove all cached semesters and calculations from local device storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await LocalCache.remove('semesters');
            await LocalCache.remove('profile');
            await LocalCache.remove('assignments');
            await LocalCache.remove('studyLogs');
            Alert.alert('Success', 'Local cache cleared.');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Sign out of your account on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AcademicAPI.logout();
          setUser(null);
          Alert.alert('Signed Out', 'You are now in guest/offline mode.');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]}
      contentContainerStyle={styles.contentContainer}>
      
      {/* Student Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
        ]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#2563EB" />
        </View>
        <Text style={[styles.name, { color: theme.text }]}>
          {profile.name || user?.name || 'Guest Student'}
        </Text>
        <Text style={styles.studentId}>
          {profile.studentId || 'No Student ID Set'}
        </Text>
        <Text style={styles.dept}>
          {profile.major || 'No Major Selected'}
        </Text>

        {user ? (
          <View style={styles.syncedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.syncedText}>{user.email}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/modal')}>
            <Text style={styles.signInBtnText}>Log In to Sync With Web</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Target Setting */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Academic Goal</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
        ]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Target CGPA</Text>
            <Text style={styles.settingDesc}>Syncs across desktop and mobile app</Text>
          </View>
          <TextInput
            style={[styles.targetInput, { color: theme.text }]}
            value={String(profile.targetCgpa || '3.50')}
            keyboardType="decimal-pad"
            onChangeText={handleUpdateTarget}
          />
        </View>
      </View>

      {/* Network & Backend Configuration */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Backend Server</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
        ]}>
        <View style={styles.networkInfo}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Active API Endpoint</Text>
          <Text style={styles.apiEndpointText}>{API_BASE_URL}</Text>
          <Text style={styles.networkHint}>
            Both Desktop Web and Mobile APK connect to this API and share the same PostgreSQL database.
          </Text>
        </View>
      </View>

      {/* Storage & Account Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Device Actions</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
        ]}>
        <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
          <Ionicons name="trash-bin-outline" size={20} color="#F59E0B" />
          <Text style={[styles.actionRowText, { color: theme.text }]}>
            Clear Offline Cache
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {user && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionRowText, { color: '#EF4444' }]}>
                Sign Out
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </>
        )}
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
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  studentId: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  dept: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563EB',
    marginTop: 4,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncedText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  signInBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  targetInput: {
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '700',
    width: 70,
    textAlign: 'center',
  },
  networkInfo: {
    gap: 6,
  },
  apiEndpointText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#2563EB',
    fontWeight: '600',
  },
  networkHint: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    marginVertical: 10,
  },
});
