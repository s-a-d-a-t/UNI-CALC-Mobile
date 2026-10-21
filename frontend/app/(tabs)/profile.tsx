import React, { useState } from 'react';
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
import Colors from '@/constants/Colors';
import { API_BASE_URL } from '@/src/api/client';
import { LocalCache, TokenStorage } from '@/src/lib/storage';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [studentName, setStudentName] = useState('Sadat');
  const [studentId, setStudentId] = useState('ST-2022-8491');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [targetCgpa, setTargetCgpa] = useState('3.80');

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Offline Cache',
      'This will remove all cached semesters and calculation data from local device storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await LocalCache.remove('semesters');
            await LocalCache.remove('assignments');
            Alert.alert('Success', 'Local cache cleared successfully.');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await TokenStorage.clearTokens();
          Alert.alert('Logged Out', 'You have been signed out.');
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
        <Text style={[styles.name, { color: theme.text }]}>{studentName}</Text>
        <Text style={styles.studentId}>{studentId}</Text>
        <Text style={styles.dept}>{department}</Text>
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
            <Text style={styles.settingDesc}>Used across dashboard and predictors</Text>
          </View>
          <TextInput
            style={[styles.targetInput, { color: theme.text }]}
            value={targetCgpa}
            keyboardType="decimal-pad"
            onChangeText={setTargetCgpa}
          />
        </View>
      </View>

      {/* Network & Backend Configuration */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Backend Connection</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' },
        ]}>
        <View style={styles.networkInfo}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Active API Endpoint</Text>
          <Text style={styles.apiEndpointText}>{API_BASE_URL}</Text>
          <Text style={styles.networkHint}>
            Android Emulator: 10.0.2.2:5000{'\n'}
            Physical Device: Your computer's Wi-Fi IP (e.g. 192.168.x.x:5000)
          </Text>
        </View>
      </View>

      {/* Storage & Account Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
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

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionRowText, { color: '#EF4444' }]}>
            Sign Out
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
