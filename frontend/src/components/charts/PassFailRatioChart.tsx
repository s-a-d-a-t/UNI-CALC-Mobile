import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface PassFailRatioChartProps {
  passedCourses: number;
  failedCourses: number;
  passedCredits: number;
  failedCredits: number;
  passRateCourses: number;
}

export function PassFailRatioChart({
  passedCourses,
  failedCourses,
  passedCredits,
  failedCredits,
  passRateCourses,
}: PassFailRatioChartProps) {
  const { colors: theme } = useTheme();

  const totalCourses = passedCourses + failedCourses;
  const totalCredits = passedCredits + failedCredits;

  if (totalCourses === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No courses recorded to calculate completion ratio.
        </Text>
      </View>
    );
  }

  const passPct = totalCourses > 0 ? (passedCourses / totalCourses) * 100 : 100;
  const failPct = 100 - passPct;

  return (
    <View style={styles.container}>
      {/* Top Highlight Headline */}
      <View style={styles.summaryRow}>
        <View>
          <Text style={[styles.rateValue, { color: passRateCourses >= 85 ? '#10B981' : theme.tint }]}>
            {passRateCourses}%
          </Text>
          <Text style={[styles.rateLabel, { color: theme.textMuted }]}>Course Completion Rate</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={[styles.chipText, { color: theme.text }]}>
            {passedCredits} of {totalCredits} hrs completed
          </Text>
        </View>
      </View>

      {/* Proportional Segmented Progress Bar */}
      <View style={[styles.ratioBarContainer, { backgroundColor: theme.cardMuted }]}>
        {passPct > 0 && (
          <View
            style={[
              styles.ratioSegment,
              {
                width: `${passPct}%`,
                backgroundColor: '#10B981',
              },
            ]}
          />
        )}
        {failPct > 0 && (
          <View
            style={[
              styles.ratioSegment,
              {
                width: `${failPct}%`,
                backgroundColor: '#EF4444',
              },
            ]}
          />
        )}
      </View>

      {/* Legend & Breakdown Chips */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <View>
            <Text style={[styles.breakdownTitle, { color: theme.text }]}>
              {passedCourses} Passed ({passedCredits} cr)
            </Text>
            <Text style={[styles.breakdownSub, { color: theme.textMuted }]}>
              {passPct.toFixed(1)}% of total load
            </Text>
          </View>
        </View>

        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <View>
            <Text style={[styles.breakdownTitle, { color: theme.text }]}>
              {failedCourses} Failed ({failedCredits} cr)
            </Text>
            <Text style={[styles.breakdownSub, { color: theme.textMuted }]}>
              {failPct.toFixed(1)}% retake candidates
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rateValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratioBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 14,
  },
  ratioSegment: {
    height: '100%',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownSub: {
    fontSize: 10,
    marginTop: 1,
  },
});
