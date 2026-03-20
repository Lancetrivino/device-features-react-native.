import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EntryCardProps } from '../types';
import { formatCoordinates } from '../utils';

const GOLD  = '#C9973A';
const STEEL = '#4A7FA5';
const ROUGE = '#C04848';

const EntryCard: React.FC<EntryCardProps> = ({ entry, onRemove, theme }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError]     = useState(false);
  const { colors, mode } = theme;
  const isDark = mode === 'dark';

  // Card entrance animation
  const cardOpacity   = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;
  // Press scale
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  // Delete button press
  const deleteScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity,   { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn  = () =>
    Animated.spring(scaleAnim,   { toValue: 0.978, friction: 12, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim,   { toValue: 1,     friction: 8,  useNativeDriver: true }).start();

  const handleDeletePressIn  = () =>
    Animated.spring(deleteScale, { toValue: 0.94, friction: 10, useNativeDriver: true }).start();
  const handleDeletePressOut = () =>
    Animated.spring(deleteScale, { toValue: 1,    friction: 6,  useNativeDriver: true }).start();

  const confirmRemove = () => {
    Alert.alert(
      'Delete Entry',
      'This memory will be permanently removed from your diary.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { if (!entry?.id) return; onRemove(entry.id); } },
      ]
    );
  };

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return 'Unknown date';
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return 'Unknown date'; }
  };

  const formatTime = (d: string) => {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatShort = (d: string) => {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  const surfaceBg = isDark ? '#161C26' : '#FFFFFF';
  const metaRowBg = isDark ? '#1A2030' : '#F8F6F2';
  const noteBg    = isDark ? '#191E2A' : '#FAFAF8';
  const locBg     = isDark ? '#141922' : '#F6F8FA';

  return (
    <Animated.View style={[
      styles.cardWrap,
      { opacity: cardOpacity, transform: [{ translateY: cardTranslate }, { scale: scaleAnim }] },
    ]}>
      <View style={[styles.card, {
        backgroundColor: surfaceBg,
        borderColor: isDark ? '#232D3E' : '#E4DDD4',
        shadowColor: isDark ? '#000' : '#6A5A4A',
      }]}>

        {/* ── Photo ── */}
        <View style={styles.imageContainer}>
          {imageLoading && !imageError && (
            <View style={[styles.imageFill, { backgroundColor: colors.surfaceElevated }]}>
              <ActivityIndicator color={GOLD} size="large" />
            </View>
          )}
          {imageError ? (
            <View style={[styles.imageFill, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.imageErrorText, { color: colors.textMuted }]}>Unavailable</Text>
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
          <View style={styles.imageFooter}>
            <View style={[styles.dateBadge, { backgroundColor: GOLD }]}>
              <Ionicons name="calendar-outline" size={10} color="#fff" />
              <Text style={styles.dateBadgeText}>{formatShort(entry.createdAt)}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.imageTimeText}>{formatTime(entry.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* ── Meta row ── */}
        <View style={[styles.metaRow, {
          backgroundColor: metaRowBg,
          borderBottomColor: isDark ? '#232D3E' : '#EDE6DE',
        }]}>
          <Ionicons name="calendar-clear-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(entry.createdAt)}</Text>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Note */}
          {entry.caption ? (
            <View style={[styles.noteBlock, {
              backgroundColor: noteBg,
              borderColor: isDark ? '#232D3E' : '#EDE6DE',
            }]}>
              <View style={styles.noteLabelRow}>
                <View style={[styles.noteLabelAccent, { backgroundColor: GOLD }]} />
                <Ionicons name="pencil-outline" size={12} color={GOLD} />
                <Text style={[styles.noteLabel, { color: GOLD }]}>NOTE</Text>
              </View>
              <Text style={[styles.noteText, { color: colors.text }]}>{entry.caption}</Text>
            </View>
          ) : null}

          {/* Location */}
          <View style={[styles.locationBlock, {
            backgroundColor: locBg,
            borderColor: isDark ? '#232D3E' : '#E8E0D8',
          }]}>
            <View style={styles.locationHeader}>
              <Ionicons name="location-outline" size={13} color={ROUGE} />
              <Text style={[styles.locationLabel, { color: ROUGE }]}>LOCATION</Text>
            </View>
            <Text style={[styles.address, { color: colors.text }]} numberOfLines={2}>
              {entry.address || 'Unknown location'}
            </Text>
            <View style={styles.coordsRow}>
              <Ionicons name="navigate-circle-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.coordinates, { color: colors.textMuted }]}>
                {formatCoordinates(entry.latitude, entry.longitude)}
              </Text>
            </View>
          </View>

          {/* Delete */}
          <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
            <TouchableOpacity
              style={[styles.deleteBtn, {
                borderColor: isDark ? '#2E1C1C' : '#EDD8D8',
                backgroundColor: isDark ? '#1C1515' : '#FDF6F6',
              }]}
              onPress={confirmRemove}
              onPressIn={handleDeletePressIn}
              onPressOut={handleDeletePressOut}
              activeOpacity={1}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={15} color={ROUGE} />
              <Text style={[styles.deleteBtnText, { color: ROUGE }]}>Delete Entry</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrap: { marginHorizontal: 16, marginVertical: 8 },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },

  imageContainer: { height: 220, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFill: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imageErrorText: { fontSize: 12, fontWeight: '500' },
  imageFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 12, paddingTop: 30,
    backgroundColor: 'rgba(0,0,0,0.50)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
  },
  dateBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  imageTimeText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  metaText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },

  body: { padding: 16, gap: 12 },

  noteBlock: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 8 },
  noteLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  noteLabelAccent: { width: 3, height: 13, borderRadius: 2 },
  noteLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  noteText: { fontSize: 14, lineHeight: 21, fontWeight: '400' },

  locationBlock: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 6 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  address: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  coordinates: { fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.3 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1,
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
});

export default EntryCard;