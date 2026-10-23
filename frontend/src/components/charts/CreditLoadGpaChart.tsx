import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { formatGpa } from '@/src/lib/gpa';
import { SemesterChartItem } from './GpaTrendChart';

interface CreditLoadGpaChartProps {
  data: SemesterChartItem[];
}

export function CreditLoadGpaChart({ data }: CreditLoadGpaChartProps) {
  const { colors: theme } = useTheme();

  const activeData = data.filter((d) => d.Credits > 0);

  if (activeData.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          No semester credit load records available.
        </Text>
      </View>
    );
  }

  const maxCredits = Math.max(...activeData.map((d) => d.Credits), 20);

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBarIndicator, { backgroundColor: theme.cardMuted, borderColor: theme.border }]} />
          <Text style={[styles.legendText, { color: theme.textMuted }]}>Credit Load (hrs)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBadgeIndicator, { backgroundColor: theme.tint }]} />
          <Text style={[styles.legendText, { color: theme.textMuted }]}>Semester GPA (0-4.0)</Text>
        </View>
      </View>

      <View style={styles.list}>
        {activeData.map((item) => {
          const creditPct = Math.min(100, Math.round((item.Credits / maxCredits) * 100));

          return (
            <View key={item.name} style={[styles.semRow, { borderColor: theme.border }]}>
              {/* Semester Name & GPA Badge */}
              <View style={styles.semHeader}>
                <Text style={[styles.semName, { color: theme.text }]}>{item.name}</Text>
                <View style={[styles.gpaPill, { backgroundColor: theme.tint }]}>
                  <Text style={styles.gpaPillText}>{formatGpa(item.GPA)} GPA</Text>
                </View>
              </View>

              {/* Credit Progress Track */}
              <View style={styles.trackRow}>
                <View style={[styles.trackBg, { backgroundColor: theme.cardMuted }]}>
                  <View
                    style={[
                      styles.trackFill,
                      {
                        width: `${creditPct}%`,
                        backgroundColor: item.GPA >= 3.0 ? theme.tint : '#3B82F6',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.creditNum, { color: theme.textMuted }]}>
                  {item.Credits} cr
                </Text>
              </View>
            </View>
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
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBarIndicator: {
    width: 12,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
  },
  legendBadgeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  semRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  semHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  semName: {
    fontSize: 12,
    fontWeight: '700',
  },
  gpaPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gpaPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  creditNum: {
    fontSize: 11,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});
