import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { formatGpa } from '@/src/lib/gpa';

export interface SemesterChartItem {
  name: string;
  GPA: number;
  Credits: number;
  cumulativeCGPA: number;
  courseCount?: number;
  passed?: number;
  failed?: number;
}

interface GpaTrendChartProps {
  data: SemesterChartItem[];
}

/**
 * Catmull-Rom Spline generator to produce smooth continuous curves
 * passing through all data points with natural curvature
 */
function getCatmullRomSpline(points: { x: number; y: number }[], segmentsPerInterval = 10) {
  if (points.length < 2) return points;
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let j = 0; j <= segmentsPerInterval; j++) {
      const t = j / segmentsPerInterval;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      result.push({ x, y });
    }
  }
  return result;
}

export function GpaTrendChart({ data }: GpaTrendChartProps) {
  const { isDark, colors: theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth - 48);

  const activeData = data.filter((d) => d.Credits > 0 || d.GPA > 0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    activeData.length > 0 ? activeData.length - 1 : null
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 50 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  if (activeData.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
        <Ionicons name="trending-up-outline" size={32} color={theme.textMuted} style={{ opacity: 0.6, marginBottom: 6 }} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Performance History Yet</Text>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Add courses and letter grades in the Calculator tab to generate your academic performance trajectory.
        </Text>
      </View>
    );
  }

  const chartHeight = 185;
  const paddingLeft = 34;
  const paddingRight = 18;
  const paddingTop = 22;
  const paddingBottom = 26;
  const plotWidth = Math.max(containerWidth - paddingLeft - paddingRight, 100);
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Convert GPA (0 to 4.0) to Y pixel coordinate
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(4.0, val));
    return paddingTop + plotHeight * (1 - clamped / 4.0);
  };

  const getX = (index: number) => {
    if (activeData.length === 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (activeData.length - 1)) * plotWidth;
  };

  // Raw coordinate points
  const gpaPoints = activeData.map((item, idx) => ({
    x: getX(idx),
    y: getY(item.GPA),
  }));

  const cgpaPoints = activeData.map((item, idx) => ({
    x: getX(idx),
    y: getY(item.cumulativeCGPA),
  }));

  // Smooth spline micro-segments (10 points per interval)
  const gpaSpline = getCatmullRomSpline(gpaPoints, 10);
  const cgpaSpline = getCatmullRomSpline(cgpaPoints, 10);

  const selectedItem =
    selectedIndex !== null && activeData[selectedIndex] ? activeData[selectedIndex] : activeData[activeData.length - 1];

  // SVG path string for Web
  const createSvgPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    return d;
  };

  const gpaSvgPath = createSvgPath(gpaSpline);
  const cgpaSvgPath = createSvgPath(cgpaSpline);

  // SVG Area fill for CGPA
  const bottomY = paddingTop + plotHeight;
  const areaSvgPath =
    cgpaSpline.length >= 2
      ? `${cgpaSvgPath} L ${cgpaSpline[cgpaSpline.length - 1].x.toFixed(1)} ${bottomY} L ${cgpaSpline[0].x.toFixed(1)} ${bottomY} Z`
      : '';

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Chart Legend & Standing Pill */}
      <View style={styles.legendHeaderRow}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: theme.tint }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Term GPA</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Cumulative CGPA</Text>
          </View>
        </View>

        <View style={[styles.scalePill, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Text style={[styles.scalePillText, { color: theme.tint }]}>4.0 Max Scale</Text>
        </View>
      </View>

      {/* Selected Semester Detail Card */}
      {selectedItem && (
        <View style={[styles.selectedCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <View style={styles.selectedCardTop}>
            <View style={styles.selectedCardTitleCol}>
              <Text style={[styles.selectedSemName, { color: theme.text }]}>{selectedItem.name}</Text>
              <Text style={[styles.selectedSemSub, { color: theme.textMuted }]}>
                {selectedItem.Credits} credits earned
                {selectedItem.courseCount ? ` · ${selectedItem.courseCount} courses` : ''}
              </Text>
            </View>

            <View style={styles.selectedGpaBadges}>
              <View style={[styles.gpaPillBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.gpaPillLabel, { color: theme.tint }]}>TERM</Text>
                <Text style={[styles.gpaPillValue, { color: theme.text }]}>{formatGpa(selectedItem.GPA)}</Text>
              </View>

              <View style={[styles.gpaPillBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.gpaPillLabel, { color: '#3B82F6' }]}>CGPA</Text>
                <Text style={[styles.gpaPillValue, { color: '#3B82F6' }]}>
                  {formatGpa(selectedItem.cumulativeCGPA)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Main Plot Area */}
      <View style={[styles.plotBox, { height: chartHeight }]}>
        {/* Horizontal Reference Lines (4.0, 3.5, 3.0, 2.0) */}
        {[
          { val: 4.0, label: '4.0', dashed: false, bold: false },
          { val: 3.5, label: '3.5', dashed: true, bold: false },
          { val: 3.0, label: '3.0', dashed: true, bold: false },
          { val: 2.0, label: '2.0', dashed: false, bold: true, color: '#EF4444' },
        ].map((line) => {
          const y = getY(line.val);
          return (
            <View key={line.val} style={[styles.gridRow, { top: y }]}>
              <Text style={[styles.yAxisLabel, { color: line.color || theme.textMuted }]}>
                {line.label}
              </Text>
              <View
                style={[
                  styles.gridLine,
                  {
                    borderColor: line.color ? 'rgba(239, 68, 68, 0.35)' : theme.border,
                    borderStyle: line.dashed ? 'dashed' : 'solid',
                    opacity: line.dashed ? 0.45 : 0.65,
                  },
                ]}
              />
              {line.val === 2.0 && (
                <View style={[styles.standingTag, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Text style={styles.standingTagText}>Pass Line</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* ---------------------------------------------------- */}
        {/* Render Smooth SVG Curves on Web                      */}
        {/* ---------------------------------------------------- */}
        {Platform.OS === 'web' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <svg
              width="100%"
              height={chartHeight}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="cgpaGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gpaGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.tint} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={theme.tint} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Area under Cumulative CGPA */}
              {areaSvgPath ? (
                <path d={areaSvgPath} fill="url(#cgpaGlowGrad)" />
              ) : null}

              {/* Cumulative CGPA Smooth Curve */}
              {cgpaSvgPath ? (
                <path
                  d={cgpaSvgPath}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Semester GPA Smooth Curve */}
              {gpaSvgPath ? (
                <path
                  d={gpaSvgPath}
                  fill="none"
                  stroke={theme.tint}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </svg>
          </View>
        )}

        {/* ---------------------------------------------------- */}
        {/* Render Native Smooth Spline Micro-Segments on Mobile */}
        {/* ---------------------------------------------------- */}
        {Platform.OS !== 'web' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 1. CGPA Spline Curve */}
            {cgpaSpline.map((pA, k) => {
              if (k === cgpaSpline.length - 1) return null;
              const pB = cgpaSpline[k + 1];
              const dx = pB.x - pA.x;
              const dy = pB.y - pA.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len === 0) return null;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const cx = (pA.x + pB.x) / 2;
              const cy = (pA.y + pB.y) / 2;

              return (
                <View
                  key={`cgpa-seg-${k}`}
                  style={[
                    styles.curveSegment,
                    {
                      left: cx - len / 2,
                      top: cy - 1.4,
                      width: len,
                      height: 2.8,
                      backgroundColor: '#3B82F6',
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}

            {/* 2. GPA Spline Curve */}
            {gpaSpline.map((pA, k) => {
              if (k === gpaSpline.length - 1) return null;
              const pB = gpaSpline[k + 1];
              const dx = pB.x - pA.x;
              const dy = pB.y - pA.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len === 0) return null;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const cx = (pA.x + pB.x) / 2;
              const cy = (pA.y + pB.y) / 2;

              return (
                <View
                  key={`gpa-seg-${k}`}
                  style={[
                    styles.curveSegment,
                    {
                      left: cx - len / 2,
                      top: cy - 1.6,
                      width: len,
                      height: 3.2,
                      backgroundColor: theme.tint,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* ---------------------------------------------------- */}
        {/* Interactive Data Point Dots & Vertical Guides        */}
        {/* ---------------------------------------------------- */}
        {activeData.map((item, index) => {
          const x = getX(index);
          const yGpa = getY(item.GPA);
          const yCgpa = getY(item.cumulativeCGPA);
          const isSelected = selectedIndex === index;

          return (
            <React.Fragment key={`point-group-${index}`}>
              {/* Vertical dotted guide on selected point */}
              {isSelected && (
                <View
                  style={[
                    styles.verticalGuideLine,
                    {
                      left: x - 0.5,
                      top: paddingTop,
                      height: plotHeight,
                      borderColor: theme.tint,
                    },
                  ]}
                />
              )}

              {/* CGPA Point Dot (Blue) */}
              <TouchableOpacity
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.8}
                style={[
                  styles.touchTarget,
                  {
                    left: x - 18,
                    top: yCgpa - 18,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pointOuterRing,
                    {
                      borderColor: isDark ? '#161B22' : '#FFFFFF',
                      backgroundColor: '#3B82F6',
                      transform: [{ scale: isSelected ? 1.25 : 1.0 }],
                    },
                  ]}
                >
                  <View style={styles.pointInnerDot} />
                </View>
              </TouchableOpacity>

              {/* GPA Point Dot (Amber/Emerald) */}
              <TouchableOpacity
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.8}
                style={[
                  styles.touchTarget,
                  {
                    left: x - 18,
                    top: yGpa - 18,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pointOuterRing,
                    {
                      borderColor: isDark ? '#161B22' : '#FFFFFF',
                      backgroundColor: theme.tint,
                      transform: [{ scale: isSelected ? 1.35 : 1.0 }],
                    },
                  ]}
                >
                  <View style={styles.pointInnerDot} />
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* X-Axis Semester Name Labels */}
      <View style={styles.xAxisRow}>
        {activeData.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={`x-label-${index}`}
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
  container: {
    width: '100%',
    paddingVertical: 2,
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  legendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scalePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  scalePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selectedCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCardTitleCol: {
    flex: 1,
  },
  selectedSemName: {
    fontSize: 13,
    fontWeight: '800',
  },
  selectedSemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  selectedGpaBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  gpaPillBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 54,
  },
  gpaPillLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gpaPillValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  plotBox: {
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
    width: 26,
    fontSize: 9.5,
    fontWeight: '700',
  },
  gridLine: {
    flex: 1,
    borderBottomWidth: 1,
  },
  standingTag: {
    position: 'absolute',
    right: 2,
    top: -9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  standingTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#EF4444',
  },
  curveSegment: {
    position: 'absolute',
    borderRadius: 2,
  },
  verticalGuideLine: {
    position: 'absolute',
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  touchTarget: {
    position: 'absolute',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  pointOuterRing: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  pointInnerDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#FFFFFF',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 34,
    paddingRight: 18,
    marginTop: 8,
  },
  xAxisCol: {
    flex: 1,
    alignItems: 'center',
  },
  xAxisLabel: {
    fontSize: 10,
  },
});
