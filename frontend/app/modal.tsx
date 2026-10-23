import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { AcademicAPI } from '@/src/api/academic';

export default function AuthModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: 'login' | 'register' }>();
  const { isDark, colors: theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>(
    params.mode === 'register' ? 'register' : 'login'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await AcademicAPI.login(email.trim(), password);
      } else {
        if (!name.trim()) {
          setError('Full Name is required for registration.');
          setLoading(false);
          return;
        }
        await AcademicAPI.register({
          name: name.trim(),
          email: email.trim(),
          password,
          major: major.trim() || undefined,
          studentId: studentId.trim() || undefined,
        });
      }
      
      // Navigate straight to the authenticated dashboard
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/landing'))}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>

          {/* Dedicated Theme Toggle Button */}
          <TouchableOpacity
            style={[styles.themeToggleBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle Theme">
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#EAB308' : '#4F46E5'}
            />
          </TouchableOpacity>

          <View style={[styles.logoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image
              source={require('../assets/images/logo1.png')}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>UniCalc Ethio</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {mode === 'login'
              ? 'Sign in to sync your academic performance'
              : 'Create your academic analytics profile'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              mode === 'login' && [styles.tabBtnActive, { backgroundColor: theme.card, borderColor: theme.border }],
            ]}
            onPress={() => {
              setMode('login');
              setError('');
            }}>
            <Text
              style={[
                styles.tabText,
                { color: mode === 'login' ? theme.tint : theme.textMuted },
                mode === 'login' && styles.tabTextActive,
              ]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              mode === 'register' && [styles.tabBtnActive, { backgroundColor: theme.card, borderColor: theme.border }],
            ]}
            onPress={() => {
              setMode('register');
              setError('');
            }}>
            <Text
              style={[
                styles.tabText,
                { color: mode === 'register' ? theme.tint : theme.textMuted },
                mode === 'register' && styles.tabTextActive,
              ]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Notice */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
            <Ionicons name="alert-circle" size={18} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {mode === 'register' && (
            <>
              <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
              <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
                <Ionicons name="person-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. Abebe Bikila"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Major / Department</Text>
              <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
                <Ionicons name="book-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={theme.textMuted}
                  value={major}
                  onChangeText={setMajor}
                />
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Student ID (Optional)</Text>
              <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
                <Ionicons name="card-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="e.g. UGR/1234/14"
                  placeholderTextColor={theme.textMuted}
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCapitalize="characters"
                />
              </View>
            </>
          )}

          <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
            <Ionicons name="mail-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. student@university.edu"
              placeholderTextColor={theme.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.tint }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Guest Continue */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => router.replace('/(tabs)')}>
          <Text style={[styles.guestText, { color: theme.textMuted }]}>
            Skip for now · <Text style={{ color: theme.tint, fontWeight: '700' }}>Explore as Guest</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 280,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  guestBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestText: {
    fontSize: 13,
  },
});
