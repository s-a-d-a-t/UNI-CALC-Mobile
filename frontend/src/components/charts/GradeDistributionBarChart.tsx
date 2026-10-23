import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { GRADE_COLORS } from '@/src/lib/gpa';

export interface GradeDistributionItem {
  name: string;
  points: number;
  courses: number;
  credits: number;
  coursePct: number;
  creditPct: number;
}

interface GradeDistributionBarChartProps {
  data: GradeDistributionItem[];
}

export function GradeDistributionBarChart({ data }: GradeDistributionBarChartProps) {
  const { colors: theme } = useTheme();
  const [metric, setMetric] = useState<'courses' | 'credits'>('courses');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No course grades logged yet to generate distribution curves.
        </Text>
      </View>
    );
  }

  // Calculate maximum value for vertical scaling
  const maxValue = Math.max(
    ...data.map((d) => (metric === 'courses' ? d.courses : d.credits)),
    1
  );

  const selectedItem = data.find((d) => d.name === selectedGrade) || null;

  return (
    <View style={styles.container}>
      {/* Metric Toggle Row */}
      <View style={styles.headerToggleRow}>
        <Text style={[styles.subheading, { color: theme.textMuted }]}>
          {metric === 'courses' ? 'Frequency by Course Count' : 'Distribution by Credit Hours'}
        </Text>
        <View style={[styles.pillSelector, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.pillBtn,
              metric === 'courses' && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
            ]}
            onPress={() => setMetric('courses')}
          >
            <Text
              style={[
                styles.pillBtnText,
                { color: metric === 'courses' ? theme.tint : theme.textMuted },
              ]}
            >
              Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pillBtn,
              metric === 'credits' && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
            ]}
            onPress={() => setMetric('credits')}
          >
            <Text
              style={[
                styles.pillBtnText,
                { color: metric === 'credits' ? theme.tint : theme.textMuted },
              ]}
            >
              Credits
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Grade Detail Card */}
      {selectedItem && (
        <View style={[styles.detailBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <View style={styles.detailHeader}>
            <View
              style={[
                styles.detailDot,
                { backgroundColor: GRADE_COLORS[selectedItem.name] || theme.tint },
              ]}
            />
            <Text style={[styles.detailGradeTitle, { color: theme.text }]}>
              Grade {selectedItem.name} ({selectedItem.points.toFixed(2)} pts)
            </Text>
          </View>
          <Text style={[styles.detailDesc, { color: theme.textMuted }]}>
            {selectedItem.courses} {selectedItem.courses === 1 ? 'course' : 'courses'} ({selectedItem.coursePct}%) ·{' '}
            {selectedItem.credits} credit hours ({selectedItem.creditPct}%)
          </Text>
        </View>
      )}

      {/* Visual Vertical Bars Container */}
      <View style={styles.barsRow}>
        {data.map((item) => {
          const val = metric === 'courses' ? item.courses : item.credits;
          const pct = metric === 'courses' ? item.coursePct : item.creditPct;
          const barHeight = Math.max(12, Math.round((val / maxValue) * 110));
          const color = GRADE_COLORS[item.name] || theme.tint;
          const isSelected = selectedGrade === item.name;

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.barColumn}
              onPress={() => setSelectedGrade(item.name === selectedGrade ? null : item.name)}
              activeOpacity={0.7}
            >
              {/* Value on top */}
              <Text style={[styles.barValueText, { color: theme.text }]}>
                {val}
                {metric === 'credits' ? 'h' : ''}
              </Text>

              {/* Vertical Bar Track */}
              <View style={[styles.barTrack, { backgroundColor: theme.cardMuted }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: color,
                      opacity: isSelected ? 1 : 0.85,
                      borderColor: isSelected ? theme.text : 'transparent',
                      borderWidth: isSelected ? 1.5 : 0,
                    },
                  ]}
                />
              </View>

              {/* Letter Label */}
              <Text style={[styles.barLetter, { color: theme.text, fontWeight: isSelected ? '900' : '700' }]}>
                {item.name}
              </Text>

              {/* Percentage below */}
              <Text style={[styles.barPct, { color: theme.textMuted }]}>
                {pct}%
              </Text>
            </TouchableOpacity>
          );
        })}
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
    lineHeight: 18,
  },
  headerToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillSelector: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailGradeTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailDesc: {
    fontSize: 11,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingTop: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: '75%',
    maxWidth: 24,
    height: 110,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    width: '100%',
    borderRadius: 5,
  },
  barLetter: {
    fontSize: 11,
    marginBottom: 1,
  },
  barPct: {
    fontSize: 9,
    fontWeight: '600',
  },
});
