import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors: theme, toggleTheme } = useTheme();

  const handleGetStarted = () => {
    router.push({ pathname: '/modal', params: { mode: 'register' } });
  };

  const handleLogin = () => {
    router.push({ pathname: '/modal', params: { mode: 'login' } });
  };

  const handleExploreGuest = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Top Navbar - Clean, mobile-friendly spacing without crowded logo name */}
      <View
        style={[
          styles.navbar,
          {
            paddingTop: insets.top ? insets.top + 6 : 14,
            borderBottomColor: theme.border,
            backgroundColor: isDark ? 'rgba(13,17,23,0.95)' : 'rgba(250,246,238,0.95)',
          },
        ]}
      >
        {/* Sleek Logo Icon on the Left */}
        <View style={[styles.logoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Image
            source={require('../assets/images/logo1.png')}
            style={styles.logoImg}
            resizeMode="cover"
          />
        </View>

        {/* Right Actions: Theme Toggle + Sign In / Get Started */}
        <View style={styles.navActions}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggleBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Theme"
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={17}
              color={isDark ? '#EAB308' : '#4F46E5'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.signInNavBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.signInNavText, { color: theme.text }]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGetStarted}
            style={[styles.getStartedNavBtn, { backgroundColor: theme.tint }]}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedNavText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Scale Compliance Badge */}
          <View style={[styles.scaleBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
            <Ionicons name="school" size={13} color={theme.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.scaleBadgeText, { color: theme.tint }]}>
              STANDARD ETHIOPIAN SCALE (4.0)
            </Text>
          </View>

          {/* Headline - Balanced for mobile screens */}
          <Text style={[styles.heroHeadline, { color: theme.text }]}>
            Empower Your Academic Path with{' '}
            <Text style={{ color: theme.tint }}>Precision Analytics</Text>
          </Text>

          {/* Subtitle */}
          <Text style={[styles.heroParagraph, { color: theme.textMuted }]}>
            A sophisticated academic management platform tailored for university students in Ethiopia.
            Organize semesters, forecast credit loads, analyze GPA trends, and chart honours.
          </Text>

          {/* Action Buttons - Finger-friendly mobile touch targets */}
          <View style={styles.heroButtonCol}>
            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.85}
              style={[styles.primaryActionBtn, { backgroundColor: theme.tint }]}
            >
              <Text style={styles.primaryActionBtnText}>Start Free Tracking</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <Text style={[styles.secondaryActionBtnText, { color: theme.text }]}>
                Access Existing Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExploreGuest}
              activeOpacity={0.7}
              style={styles.guestLinkBtn}
            >
              <Ionicons name="eye-outline" size={15} color={theme.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.guestLinkText, { color: theme.textMuted }]}>
                Continue as Guest / Offline Preview
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mobile-Adapted Dashboard Showcase Card */}
          <View style={[styles.heroIllustrationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeaderBar}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.cardHeaderTitle, { color: theme.textMuted }]}>
                  Live Academic Dashboard
                </Text>
              </View>
              <View style={[styles.platformBadge, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <Text style={[styles.platformBadgeText, { color: theme.tint }]}>HERQA 4.0</Text>
              </View>
            </View>

            <View style={[styles.imageWrapper, { borderColor: theme.border }]}>
              <Image
                source={require('../assets/images/landing_hero.png')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* Features Section - Maintained UI order with clean mobile rhythm */}
        <View style={[styles.featuresSection, { backgroundColor: isDark ? 'rgba(22,27,34,0.35)' : 'rgba(244,239,230,0.45)', borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Engineered for Academic Excellence
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              Real-time tools built to measure, forecast, and elevate your university performance.
            </Text>
          </View>

          {/* Feature 1 */}
          <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.featureIconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Ionicons name="calculator" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Interactive Semester Manager
            </Text>
            <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
              Manage multiple academic terms seamlessly. Add, edit, or adjust courses in real-time with
              automatic credit load computation aligned to standard 4.0 scales.
            </Text>
          </View>

          {/* Feature 2 */}
          <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.featureIconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Ionicons name="trending-up" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Advanced Trend Analysis
            </Text>
            <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
              Visualize your academic path with GPA trend analytics, grade distribution curves, and
              instant academic standing badges (Dean's Honor, First Class Distinction).
            </Text>
          </View>

          {/* Feature 3 */}
          <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.featureIconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Ionicons name="trophy" size={22} color={theme.tint} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Target & Graduation Planner
            </Text>
            <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
              Define your dream graduation honours. The predictive engine reverse-engineers future semesters
              to compute the exact average GPA required to cross the finish line.
            </Text>
          </View>
        </View>

        {/* Official Scale Compliance Banner */}
        <View style={styles.complianceContainer}>
          <View style={[styles.complianceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.shieldIconCircle, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name="shield-checkmark" size={30} color={theme.tint} />
            </View>
            <View style={[styles.complianceBadge, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Text style={[styles.complianceBadgeText, { color: theme.tint }]}>
                OFFICIAL SCALE COMPLIANCE
              </Text>
            </View>
            <Text style={[styles.complianceTitle, { color: theme.text }]}>
              Standard Grading Integrity
            </Text>
            <Text style={[styles.complianceDesc, { color: theme.textMuted }]}>
              UniCalc Ethio aligns directly with standard policies used across universities in Ethiopia.
              The scale rules map A/A+ to 4.0, A- to 3.75, B+ to 3.50, B to 3.00, down to F at 0.0 points
              with complete mathematical integrity.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerCopyright, { color: theme.textMuted }]}>
            © {new Date().getFullYear()} UniCalc Ethio. Built with Expo & React Native.
          </Text>
          <View style={styles.footerLinksRow}>
            <Text style={[styles.footerCredit, { color: theme.textMuted }]}>
              Developed by <Text style={{ color: theme.tint, fontWeight: '700' }}>Sadat</Text>
            </Text>
            <Text style={[styles.footerDot, { color: theme.textMuted }]}>•</Text>
            <Text style={[styles.footerLink, { color: theme.textMuted }]}>sdrkk66@gmail.com</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInNavBtn: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
  },
  signInNavText: {
    fontSize: 12,
    fontWeight: '700',
  },
  getStartedNavBtn: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 9,
  },
  getStartedNavText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  heroSection: {
    paddingHorizontal: 18,
    paddingTop: 22,
    alignItems: 'center',
  },
  scaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  scaleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroParagraph: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 440,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  heroButtonCol: {
    width: '100%',
    maxWidth: 360,
    gap: 10,
    marginBottom: 24,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  guestLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  guestLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  heroIllustrationCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  platformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  platformBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  imageWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featuresSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 360,
  },
  featureCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  complianceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  complianceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  shieldIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  complianceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  complianceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  complianceDesc: {
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 5,
  },
  footerCopyright: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerCredit: {
    fontSize: 10.5,
  },
  footerDot: {
    fontSize: 10.5,
  },
  footerLink: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
