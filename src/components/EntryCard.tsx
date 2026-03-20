import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EntryCardProps } from '../types';
import { formatCoordinates } from '../utils';

const { width } = Dimensions.get('window');

const EntryCard: React.FC<EntryCardProps> = ({ entry, onRemove, theme }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { colors, mode } = theme;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  const confirmRemove = () => {
    Alert.alert(
      'Remove Entry?',
      'This travel memory will be permanently deleted from your diary.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (!entry?.id) return;
            onRemove(entry.id);
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Unknown date';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch { return 'Unknown date'; }
  };

  const formatTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleAnim }] }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: mode === 'dark' ? '#000' : colors.shadow,
          },
        ]}
      >
        {/* ── Photo ── */}
        <View style={styles.imageContainer}>
          {imageLoading && !imageError && (
            <View style={[styles.imageFill, { backgroundColor: colors.surfaceElevated }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          {imageError ? (
            <View style={[styles.imageFill, styles.imageErrorBox, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.imageErrorText, { color: colors.textMuted }]}>
                Image unavailable
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: entry.imageUri }}
              style={styles.image}
              onLoad={() => setImageLoading(false)}
              onError={() => { setImageLoading(false); setImageError(true); }}
              resizeMode="cover"
            />
          )}

          {/* Date badge */}
          <View style={[styles.dateBadge, { backgroundColor: colors.overlay }]}>
            <Ionicons name="calendar-outline" size={11} color="#fff" style={styles.badgeIcon} />
            <Text style={styles.dateBadgeText}>{formatDate(entry.createdAt)}</Text>
          </View>

          {/* Time chip */}
          <View style={[styles.timeBadge, { backgroundColor: colors.overlay }]}>
            <Ionicons name="time-outline" size={11} color="#fff" style={styles.badgeIcon} />
            <Text style={styles.dateBadgeText}>{formatTime(entry.createdAt)}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Location row */}
          <View style={styles.locationRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="location" size={14} color={colors.primary} />
            </View>
            <Text
              style={[styles.address, { color: colors.text }]}
              numberOfLines={2}
            >
              {entry.address || 'Unknown location'}
            </Text>
          </View>

          {/* Coordinates */}
          <View style={styles.coordsRow}>
            <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.coordinates, { color: colors.textMuted }]}>
              {formatCoordinates(entry.latitude, entry.longitude)}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Remove button */}
          <TouchableOpacity
            style={[styles.removeBtn, { backgroundColor: colors.dangerLight }]}
            onPress={confirmRemove}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Remove this travel entry"
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.removeBtnText, { color: colors.danger }]}>
              Remove Entry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 5,
  },
  imageContainer: {
    height: 210,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorBox: {
    gap: 8,
  },
  imageErrorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  badgeIcon: {
    marginTop: 0.5,
  },
  dateBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    padding: 16,
    gap: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  address: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    lineHeight: 22,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 38,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 14,
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default EntryCard;