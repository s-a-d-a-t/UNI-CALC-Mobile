import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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

      {/* Top Navbar */}
      <View style={[styles.navbar, { borderBottomColor: theme.border, backgroundColor: isDark ? 'rgba(13,17,23,0.95)' : 'rgba(250,246,238,0.95)' }]}>
        <View style={styles.brandRow}>
          <View style={[styles.logoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image
              source={require('../assets/images/logo1.png')}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={[styles.brandTitle, { color: theme.text }]}>UniCalc Ethio</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
              GPA TRACKER & ANALYTICS
            </Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity onPress={handleLogin} style={styles.signInBtn}>
            <Text style={[styles.signInText, { color: theme.textMuted }]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGetStarted}
            style={[styles.getStartedNavBtn, { backgroundColor: theme.tint }]}>
            <Text style={styles.getStartedNavText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Scale Compliance Badge */}
          <View style={[styles.scaleBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
            <Ionicons name="school" size={14} color={theme.tint} style={{ marginRight: 6 }} />
            <Text style={[styles.scaleBadgeText, { color: theme.tint }]}>
              STANDARD ETHIOPIAN SCALE (4.0)
            </Text>
          </View>

          {/* Headline */}
          <Text style={[styles.heroHeadline, { color: theme.text }]}>
            Empower Your Academic Path with{' '}
            <Text style={{ color: theme.tint }}>Precision Analytics</Text>
          </Text>

          {/* Subtitle */}
          <Text style={[styles.heroParagraph, { color: theme.textMuted }]}>
            A sophisticated academic management platform tailored for university students in Ethiopia.
            Seamlessly organize semesters, project future credit hours, analyze academic performance curves,
            and chart a structured path to graduation honours.
          </Text>

          {/* Action Buttons */}
          <View style={styles.heroButtonCol}>
            <TouchableOpacity
              onPress={handleGetStarted}
              style={[styles.primaryActionBtn, { backgroundColor: theme.tint }]}>
              <Text style={styles.primaryActionBtnText}>Start Free Tracking</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={[styles.secondaryActionBtnText, { color: theme.text }]}>
                Access Existing Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleExploreGuest}
              style={styles.guestLinkBtn}>
              <Ionicons name="eye-outline" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.guestLinkText, { color: theme.textMuted }]}>
                Continue as Guest / Offline Preview
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero Illustration Card */}
          <View style={[styles.heroIllustrationCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
            {/* Simulated window header bar */}
            <View style={styles.windowHeader}>
              <View style={styles.windowDots}>
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              </View>
              <View style={[styles.windowAddress, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)', borderColor: theme.border }]}>
                <Text style={[styles.windowAddressText, { color: theme.textMuted }]}>
                  unicalc-ethio.org/dashboard
                </Text>
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

        {/* Features Section */}
        <View style={[styles.featuresSection, { backgroundColor: isDark ? 'rgba(22,27,34,0.4)' : 'rgba(244,239,230,0.5)', borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Engineered for Academic Excellence
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              A suite of sophisticated, real-time tools built to help you measure, forecast, and elevate your performance.
            </Text>
          </View>

          {/* Feature 1 */}
          <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.featureIconCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Ionicons name="calculator" size={24} color={theme.tint} />
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
              <Ionicons name="trending-up" size={24} color={theme.tint} />
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
              <Ionicons name="trophy" size={24} color={theme.tint} />
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
              <Ionicons name="shield-checkmark" size={32} color={theme.tint} />
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
              The scale rules map A/A+ to 4.0, A- to 3.75, B+ to 3.50, B to 3.00, down to F at 0.0 points.
              Calculations reflect exact academic standings with complete mathematical integrity.
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
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  signInText: {
    fontSize: 13,
    fontWeight: '700',
  },
  getStartedNavBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  getStartedNavText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 18,
    paddingTop: 28,
    alignItems: 'center',
  },
  scaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  scaleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroParagraph: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 520,
    marginBottom: 24,
  },
  heroButtonCol: {
    width: '100%',
    maxWidth: 380,
    gap: 10,
    marginBottom: 28,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
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
    paddingVertical: 8,
  },
  guestLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroIllustrationCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  windowDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  windowAddress: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 3,
    alignItems: 'center',
  },
  windowAddressText: {
    fontSize: 10,
    fontWeight: '700',
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featuresSection: {
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: 400,
  },
  featureCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  complianceContainer: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  complianceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  shieldIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  complianceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  complianceBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  complianceTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  complianceDesc: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  footerCopyright: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerCredit: {
    fontSize: 11,
  },
  footerDot: {
    fontSize: 11,
  },
  footerLink: {
    fontSize: 11,
    fontWeight: '600',
  },
});
