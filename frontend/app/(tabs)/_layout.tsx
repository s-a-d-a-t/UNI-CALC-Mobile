import React, { useState, useEffect } from 'react';
import { Tabs, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { AcademicAPI } from '@/src/api/academic';
import { calculateGlobalStats, formatGpa } from '@/src/lib/gpa';

export default function TabLayout() {
  const { isDark, colors: theme, toggleTheme } = useTheme();
  const [cgpa, setCgpa] = useState('0.00');

  useEffect(() => {
    async function loadHeaderCgpa() {
      try {
        const semesters = await AcademicAPI.getSemesters();
        if (semesters && semesters.length > 0) {
          const stats = calculateGlobalStats(semesters);
          setCgpa(formatGpa(stats.cgpa));
        }
      } catch (e) {}
    }
    loadHeaderCgpa();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: theme.text,
          fontSize: 16,
        },
        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
            <View style={[styles.headerLogoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Image
                source={require('../../assets/images/logo1.png')}
                style={styles.headerLogo}
                resizeMode="cover"
              />
            </View>
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <View style={[styles.cgpaBadge, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Text style={[styles.cgpaBadgeText, { color: theme.tint }]}>
                {cgpa} CGPA
              </Text>
            </View>

            {/* Dedicated Theme Toggle Button in Header */}
            <Pressable
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themeToggleHeaderBtn,
                { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={15}
                color={isDark ? '#EAB308' : '#4F46E5'}
              />
            </Pressable>

            <Link href="/modal" asChild>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginLeft: 8 })}>
                <Ionicons name="person-circle-outline" size={24} color={theme.text} />
              </Pressable>
            </Link>
          </View>
        ),
      }}>
      
      {/* 1. Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerTitle: 'UniCalc Ethio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 2. GPA & CGPA Calculator Tab */}
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculator',
          headerTitle: 'GPA Calculator',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calculator' : 'calculator-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 3. Planner Tab */}
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          headerTitle: 'Academic Planner',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />

      {/* 4. Student Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Student Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    marginLeft: 16,
  },
  headerLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  cgpaBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cgpaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  themeToggleHeaderBtn: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
