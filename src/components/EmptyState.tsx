import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmptyStateProps } from '../types';

const EmptyState: React.FC<EmptyStateProps> = ({ theme }) => {
  const { colors } = theme;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={[styles.title, { color: colors.text }]}>No Entries Yet</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Start documenting your travels by tapping the{' '}
        <Text style={{ color: colors.primary, fontWeight: '700' }}>+ Add Entry</Text>
        {' '}button below.
      </Text>
      <View style={[styles.hint, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>
          📷  Take a photo → 📍 Get location → 💾 Save memory
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  hint: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default EmptyState;
