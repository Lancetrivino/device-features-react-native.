import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeToggleProps } from '../types';

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const { mode } = theme;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.82, duration: 90, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.btn}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        accessibilityRole="button"
      >
        <Ionicons
          name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
          size={19}
          color="#ffffff"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 10,
    backgroundColor: '#ffffff22',
    borderColor: '#ffffff40',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
});

export default ThemeToggle;