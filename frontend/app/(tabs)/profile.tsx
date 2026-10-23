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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { AcademicAPI } from '@/src/api/academic';
import { LocalCache } from '@/src/lib/storage';
import { AcademicProfile, User } from '@/src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<AcademicProfile>({
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
      if (userProfile) {
        setFormData({
          name: userProfile.name || '',
          studentId: userProfile.studentId || '',
          major: userProfile.major || '',
          targetCgpa: userProfile.targetCgpa || 3.5,
          graduationCredits: userProfile.graduationCredits || 145,
          coreCreditsRequired: userProfile.coreCreditsRequired || 100,
          electiveCreditsRequired: userProfile.electiveCreditsRequired || 45,
        });
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const verifiedCgpa = Math.min(Math.max(Number(formData.targetCgpa) || 0, 0), 4.0);
      const updated = await AcademicAPI.updateProfile({
        ...formData,
        targetCgpa: verifiedCgpa,
        graduationCredits: Number(formData.graduationCredits) || 145,
        coreCreditsRequired: Number(formData.coreCreditsRequired) || 100,
        electiveCreditsRequired: Number(formData.electiveCreditsRequired) || 45,
      });
      setFormData(updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AcademicAPI.logout();
          setUser(null);
          router.replace('/landing');
        },
      },
    ]);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Offline Cache',
      'This removes all local cached semesters and profile data from device storage.',
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
            Alert.alert('Success', 'Local offline cache cleared.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      
      {/* Profile Header Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.avatarBox, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
            <Ionicons name="person" size={28} color={theme.tint} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Student Profile</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              Configure your academic details and graduation targets
            </Text>
          </View>
        </View>

        {user ? (
          <View style={[styles.accountStatusBadge, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
            <Ionicons name="cloud-done" size={14} color={theme.tint} />
            <Text style={[styles.accountStatusText, { color: theme.tint }]}>
              Synced: {user.email}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.signInPromptBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
            onPress={() => router.push('/modal')}>
            <Ionicons name="log-in-outline" size={16} color={theme.tint} />
            <Text style={[styles.signInPromptText, { color: theme.tint }]}>
              Sign In to Cloud Sync with Web
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Success Notification */}
      {showSuccess && (
        <View style={[styles.successBox, { backgroundColor: theme.successBg, borderColor: theme.success }]}>
          <Ionicons name="checkmark-circle" size={18} color={theme.success} />
          <Text style={[styles.successText, { color: theme.success }]}>
            Profile saved successfully! Data is synchronized.
          </Text>
        </View>
      )}

      {/* Student Details Form Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Academic Identity</Text>

        {/* Full Name */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Full Name</Text>
        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
          <Ionicons name="person-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={formData.name}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            placeholder="e.g. Abebe Kebede"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* Student ID */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Student ID / Registration</Text>
        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
          <Ionicons name="card-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={formData.studentId}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, studentId: text }))}
            placeholder="e.g. UGR/1234/18"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
          />
        </View>

        {/* Major / Department */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Major / Department</Text>
        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
          <Ionicons name="book-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={formData.major}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, major: text }))}
            placeholder="e.g. Computer Science"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      {/* Graduation Targets Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Graduation Targets</Text>

        {/* Target CGPA */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Target CGPA (Scale 0.00 - 4.00)</Text>
        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
          <Ionicons name="trophy-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={String(formData.targetCgpa)}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, targetCgpa: parseFloat(text) || 0 }))}
            placeholder="3.50"
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Total Graduation Credits */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Total Graduation Credits Goal</Text>
        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
          <Ionicons name="ribbon-outline" size={16} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={String(formData.graduationCredits)}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, graduationCredits: parseInt(text, 10) || 0 }))}
            placeholder="145"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
          />
        </View>

        {/* Core & Elective split */}
        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Core Credits</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={String(formData.coreCreditsRequired)}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, coreCreditsRequired: parseInt(text, 10) || 0 }))}
                placeholder="100"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={styles.splitCol}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Elective Credits</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={String(formData.electiveCreditsRequired)}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, electiveCreditsRequired: parseInt(text, 10) || 0 }))}
                placeholder="45"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.tint }]}
          onPress={handleSave}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Profile Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Account & App Actions Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Account & Storage</Text>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomColor: theme.border }]}
          onPress={handleClearCache}>
          <View style={styles.actionRowLeft}>
            <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
            <Text style={[styles.actionRowText, { color: theme.text }]}>Clear Offline Cache</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <View style={styles.actionRowLeft}>
              <Ionicons name="log-out-outline" size={18} color={theme.danger} />
              <Text style={[styles.actionRowText, { color: theme.danger }]}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.danger} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/landing')}>
            <View style={styles.actionRowLeft}>
              <Ionicons name="home-outline" size={18} color={theme.tint} />
              <Text style={[styles.actionRowText, { color: theme.tint }]}>View Landing Page</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.tint} />
          </TouchableOpacity>
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  accountStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  accountStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  signInPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  signInPromptText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitCol: {
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
