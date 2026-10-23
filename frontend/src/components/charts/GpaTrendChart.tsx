import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { formatGpa } from '@/src/lib/gpa';

export interface SemesterChartItem {
  name: string;
  GPA: number;
  Credits: number;
  cumulativeCGPA: number;
  courseCount?: number;
}

interface GpaTrendChartProps {
  data: SemesterChartItem[];
}

export function GpaTrendChart({ data }: GpaTrendChartProps) {
  const { isDark, colors: theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null
  );

  const activeData = data.filter((d) => d.Credits > 0 || d.GPA > 0);

  if (activeData.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Add courses to multiple semesters to view your GPA trend curve.
        </Text>
      </View>
    );
  }

  const chartHeight = 160;
  const paddingHorizontal = 30;
  const paddingVertical = 20;
  const usableHeight = chartHeight - paddingVertical * 2;

  // Map GPA (0 to 4.0) to Y pixel coordinate (0 at top, 4.0 at top, 0.0 at bottom)
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(4.0, val));
    return paddingVertical + usableHeight * (1 - clamped / 4.0);
  };

  const selectedItem = selectedIndex !== null ? activeData[selectedIndex] : null;

  return (
    <View style={styles.wrapper}>
      {/* Chart Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.tint }]} />
          <Text style={[styles.legendText, { color: theme.textMuted }]}>Semester GPA</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.legendText, { color: theme.textMuted }]}>Cumulative CGPA</Text>
        </View>
      </View>

      {/* Selected Item Tooltip Card */}
      {selectedItem && (
        <View style={[styles.tooltipCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Text style={[styles.tooltipTitle, { color: theme.text }]}>{selectedItem.name}</Text>
          <View style={styles.tooltipMetricsRow}>
            <Text style={[styles.tooltipMetric, { color: theme.tint }]}>
              Term GPA: <Text style={styles.tooltipMetricVal}>{formatGpa(selectedItem.GPA)}</Text>
            </Text>
            <Text style={[styles.tooltipMetric, { color: '#3B82F6' }]}>
              CGPA: <Text style={styles.tooltipMetricVal}>{formatGpa(selectedItem.cumulativeCGPA)}</Text>
            </Text>
            <Text style={[styles.tooltipMetric, { color: theme.textMuted }]}>
              Credits: <Text style={styles.tooltipMetricVal}>{selectedItem.Credits}</Text>
            </Text>
          </View>
        </View>
      )}

      {/* Main Chart Area */}
      <View style={[styles.chartBox, { height: chartHeight }]}>
        {/* Horizontal Grid Lines for 4.0, 3.0, 2.0, 1.0 */}
        {[4.0, 3.0, 2.0, 1.0].map((val) => {
          const y = getY(val);
          return (
            <View key={val} style={[styles.gridRow, { top: y }]}>
              <Text style={[styles.yAxisLabel, { color: theme.textMuted }]}>{val.toFixed(1)}</Text>
              <View style={[styles.gridLine, { borderColor: theme.border }]} />
            </View>
          );
        })}

        {/* Dynamic Points and Line Segments */}
        <View style={styles.plotArea}>
          {activeData.map((item, index) => {
            const isSingle = activeData.length === 1;
            const leftPct = isSingle ? 50 : (index / (activeData.length - 1)) * 100;
            const yGpa = getY(item.GPA);
            const yCgpa = getY(item.cumulativeCGPA);
            const isSelected = selectedIndex === index;

            // Connect lines to next point if exists
            let lineGpa = null;
            let lineCgpa = null;
            if (index < activeData.length - 1) {
              const nextItem = activeData[index + 1];
              const nextLeftPct = ((index + 1) / (activeData.length - 1)) * 100;
              const nextYGpa = getY(nextItem.GPA);
              const nextYCgpa = getY(nextItem.cumulativeCGPA);

              // We calculate segment width in percentage and angle
              lineGpa = {
                y1: yGpa,
                y2: nextYGpa,
              };
              lineCgpa = {
                y1: yCgpa,
                y2: nextYCgpa,
              };
            }

            return (
              <View
                key={index}
                style={[
                  styles.dataColumn,
                  {
                    left: `${leftPct}%`,
                    transform: [{ translateX: -16 }],
                  },
                ]}
              >
                {/* GPA Point Dot */}
                <TouchableOpacity
                  onPress={() => setSelectedIndex(index)}
                  activeOpacity={0.7}
                  style={[
                    styles.pointTouchable,
                    {
                      top: yGpa - 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pointDot,
                      {
                        backgroundColor: theme.tint,
                        borderColor: theme.card,
                        transform: [{ scale: isSelected ? 1.3 : 1 }],
                      },
                    ]}
                  />
                </TouchableOpacity>

                {/* CGPA Point Dot */}
                <TouchableOpacity
                  onPress={() => setSelectedIndex(index)}
                  activeOpacity={0.7}
                  style={[
                    styles.pointTouchable,
                    {
                      top: yCgpa - 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pointDot,
                      {
                        backgroundColor: '#3B82F6',
                        borderColor: theme.card,
                        transform: [{ scale: isSelected ? 1.3 : 1 }],
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* X-Axis Semester Labels */}
      <View style={styles.xAxisRow}>
        {activeData.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedIndex(index)}
              style={styles.xAxisCol}
            >
              <Text
                style={[
                  styles.xAxisLabel,
                  {
                    color: isSelected ? theme.tint : theme.textMuted,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {item.name.replace(/Semester/i, 'Sem')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  tooltipMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tooltipMetric: {
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipMetricVal: {
    fontWeight: '800',
  },
  chartBox: {
    position: 'relative',
    width: '100%',
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabel: {
    width: 24,
    fontSize: 10,
    fontWeight: '600',
  },
  gridLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  plotArea: {
    position: 'absolute',
    left: 28,
    right: 14,
    top: 0,
    bottom: 0,
  },
  dataColumn: {
    position: 'absolute',
    width: 32,
    height: '100%',
    alignItems: 'center',
  },
  pointTouchable: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 14,
    marginTop: 6,
  },
  xAxisCol: {
    flex: 1,
    alignItems: 'center',
  },
  xAxisLabel: {
    fontSize: 10,
  },
});
