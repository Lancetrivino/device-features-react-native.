import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyStateProps } from '../types';

const GOLD  = '#C9973A';
const STEEL = '#4A7FA5';
const ROUGE = '#C04848';

const EmptyState: React.FC<EmptyStateProps> = ({ theme }) => {
  const { colors, mode } = theme;
  const isDark = mode === 'dark';

  // Staggered entrance animations
  const iconScale   = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(10)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(16)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale,   { toValue: 1,    friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1,    duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(cardY,       { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(hintOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const steps = [
    { icon: 'camera-outline' as const,   label: 'Take a photo',    desc: 'Capture your location visually',      color: STEEL },
    { icon: 'location-outline' as const, label: 'Location tagged', desc: 'Coordinates recorded automatically',  color: ROUGE },
    { icon: 'bookmark-outline' as const, label: 'Entry saved',     desc: 'Stored permanently in your diary',    color: GOLD  },
  ];

  return (
    <View style={styles.container}>

      {/* Icon lockup */}
      <Animated.View style={[styles.iconBlock, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
        <View style={[styles.iconRing, { borderColor: isDark ? '#2A3040' : '#DDD5C8' }]}>
          <Ionicons name="earth-outline" size={44} color={isDark ? '#3A4A60' : '#C8BEB0'} />
        </View>
        <View style={[styles.iconOverlay, { backgroundColor: GOLD }]}>
          <Ionicons name="add" size={16} color="#fff" />
        </View>
      </Animated.View>

      {/* Title + subtitle */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        <Text style={[styles.title, { color: colors.text }]}>No entries yet</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Begin documenting your travels by adding your first diary entry.
        </Text>
      </Animated.View>

      {/* Steps card */}
      <Animated.View style={[
        styles.stepsCard,
        { backgroundColor: isDark ? '#161C26' : '#FFFFFF', borderColor: isDark ? '#232D3E' : '#E8E0D8' },
        { opacity: cardOpacity, transform: [{ translateY: cardY }] },
      ]}>
        <View style={styles.stepsHeadingRow}>
          <Ionicons name="list-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.stepsHeading, { color: colors.textMuted }]}>HOW TO GET STARTED</Text>
        </View>
        {steps.map((step, i) => (
          <View key={i}>
            <View style={styles.stepRow}>
              <View style={[styles.stepNum, { borderColor: step.color + '50', backgroundColor: step.color + '12' }]}>
                <Text style={[styles.stepNumText, { color: step.color }]}>{i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepLabel, { color: colors.text }]}>{step.label}</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>{step.desc}</Text>
              </View>
              <Ionicons name={step.icon} size={18} color={step.color} />
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.stepConnector, { backgroundColor: isDark ? '#232D3E' : '#EDE6DE' }]} />
            )}
          </View>
        ))}
      </Animated.View>

      {/* Hint */}
      <Animated.View style={[
        styles.prompt,
        { backgroundColor: isDark ? GOLD + '12' : GOLD + '0E', borderColor: GOLD + '40' },
        { opacity: hintOpacity },
      ]}>
        <Ionicons name="arrow-down-circle-outline" size={16} color={isDark ? GOLD : '#A07828'} />
        <Text style={[styles.promptText, { color: isDark ? GOLD : '#A07828' }]}>
          Tap the button below to add your first entry
        </Text>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 40, paddingBottom: 140, gap: 20,
  },

  iconBlock: { position: 'relative', marginBottom: 4 },
  iconRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  iconOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },

  textBlock: { alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 280 },

  stepsCard: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 18, gap: 0 },
  stepsHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  stepsHeading: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontWeight: '700' },
  stepContent: { flex: 1, gap: 2 },
  stepLabel: { fontSize: 13, fontWeight: '600' },
  stepDesc: { fontSize: 12, lineHeight: 17 },
  stepConnector: { width: 1, height: 12, marginLeft: 13, marginVertical: 2 },

  prompt: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 18,
    borderRadius: 8, borderWidth: 1,
  },
  promptText: { fontSize: 13, fontWeight: '500', letterSpacing: 0.2 },
});

export default EmptyState;