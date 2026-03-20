import React, { useState, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { randomUUID } from '../utils/uuid';
import { RootStackParamList, TravelEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useDiary } from '../context/DiaryContext';
import { ThemeToggle } from '../components';
import {
  requestCameraPermission,
  requestLocationPermission,
  getCurrentLocation,
  sendEntrySavedNotification,
  validateNewEntry,
  isValidImageUri,
} from '../utils';

type AddEntryNavProp = StackNavigationProp<RootStackParamList, 'AddEntry'>;

interface EntryDraft {
  imageUri: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  caption: string;
}

const EMPTY_DRAFT: EntryDraft = {
  imageUri: null, address: null, latitude: null, longitude: null, caption: '',
};

const HEADER_BG = '#111827';
const GOLD      = '#C9973A';
const STEEL     = '#4A7FA5';
const ROUGE     = '#C04848';

const AddEntryScreen: React.FC = () => {
  const navigation = useNavigation<AddEntryNavProp>();
  const { theme, toggleTheme } = useTheme();
  const { addEntry } = useDiary();
  const { colors, mode } = theme;

  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const savedRef     = useRef(false);
  const saveBtnScale = useRef(new Animated.Value(1)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const isDark       = mode === 'dark';

  // Section staggered entrance
  const s1Opacity = useRef(new Animated.Value(0)).current;
  const s1Y       = useRef(new Animated.Value(14)).current;
  const s2Opacity = useRef(new Animated.Value(0)).current;
  const s2Y       = useRef(new Animated.Value(14)).current;
  const s3Opacity = useRef(new Animated.Value(0)).current;
  const s3Y       = useRef(new Animated.Value(14)).current;

  // Location detected flash
  const locFlash  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeIn = (opacity: Animated.Value, y: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
        Animated.timing(y,       { toValue: 0, duration: 320, delay, useNativeDriver: true }),
      ]);
    Animated.sequence([
      makeIn(s1Opacity, s1Y, 0),
      makeIn(s2Opacity, s2Y, 0),
      makeIn(s3Opacity, s3Y, 0),
    ]).start();
  }, []);

  // Flash location block green when address detected
  useEffect(() => {
    if (draft.address) {
      Animated.sequence([
        Animated.timing(locFlash, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(locFlash, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    }
  }, [draft.address]);

  // Camera pulse
  useLayoutEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.035, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,     duration: 1400, useNativeDriver: true }),
      ])
    );
    if (!draft.imageUri) loop.start();
    else { loop.stop(); pulseAnim.setValue(1); }
    return () => loop.stop();
  }, [draft.imageUri]);

  useFocusEffect(
    useCallback(() => {
      if (!savedRef.current) {
        setDraft(EMPTY_DRAFT);
        setIsFetchingLocation(false);
        setIsSaving(false);
        setIsTakingPhoto(false);
      }
      savedRef.current = false;
    }, [])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'New Entry',
      headerStyle: { backgroundColor: HEADER_BG },
      headerTintColor: '#ffffff',
      headerTitleStyle: { color: '#ffffff', fontWeight: '700', fontSize: 17, letterSpacing: 0.2 },
      headerRight: () => <ThemeToggle theme={theme} onToggle={toggleTheme} />,
    });
  }, [navigation, theme, toggleTheme]);

  const fetchLocationForImage = useCallback(async () => {
    setIsFetchingLocation(true);
    try {
      const locGranted = await requestLocationPermission();
      if (!locGranted) {
        Alert.alert('Location Required', 'Location permission is needed to tag your entry.');
        setDraft(prev => ({ ...prev, address: 'Location unavailable', latitude: 0, longitude: 0 }));
        return;
      }
      const result = await getCurrentLocation();
      if (!result) {
        Alert.alert('Location Error', 'Could not determine your current location.');
        setDraft(prev => ({ ...prev, address: 'Could not get location', latitude: 0, longitude: 0 }));
        return;
      }
      setDraft(prev => ({ ...prev, address: result.address, latitude: result.latitude, longitude: result.longitude }));
    } catch {
      Alert.alert('Error', 'Failed to fetch location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (isTakingPhoto || isFetchingLocation) return;
    setIsTakingPhoto(true);
    try {
      const granted = await requestCameraPermission();
      if (!granted) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.88,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) { Alert.alert('Error', 'Failed to capture photo.'); return; }
      if (!isValidImageUri(asset.uri)) { Alert.alert('Error', 'Invalid image URI.'); return; }
      setDraft(prev => ({ ...prev, imageUri: asset.uri }));
      await fetchLocationForImage();
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsTakingPhoto(false);
    }
  }, [isTakingPhoto, isFetchingLocation, fetchLocationForImage]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const validation = validateNewEntry({
      imageUri: draft.imageUri, address: draft.address,
      latitude: draft.latitude, longitude: draft.longitude,
    });
    if (!validation.isValid) {
      Alert.alert('Cannot Save', validation.errors.join('\n\n'), [{ text: 'OK' }]);
      return;
    }
    Animated.sequence([
      Animated.timing(saveBtnScale, { toValue: 0.93, duration: 75, useNativeDriver: true }),
      Animated.spring(saveBtnScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    setIsSaving(true);
    try {
      const newEntry: TravelEntry = {
        id: randomUUID(),
        imageUri: draft.imageUri!,
        address: draft.address!,
        latitude: draft.latitude!,
        longitude: draft.longitude!,
        createdAt: new Date().toISOString(),
        caption: draft.caption.trim(),
      };
      await addEntry(newEntry);
      await sendEntrySavedNotification(newEntry);
      savedRef.current = true;
      setDraft(EMPTY_DRAFT);
      Alert.alert('Entry Saved', 'Your travel memory has been added to your diary.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Save Failed', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, draft, addEntry, navigation]);

  const handleDiscard = useCallback(() => {
    if (!draft.imageUri && !draft.caption) { navigation.goBack(); return; }
    Alert.alert('Discard Entry?', 'Your progress will not be saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { setDraft(EMPTY_DRAFT); navigation.goBack(); } },
    ]);
  }, [draft.imageUri, draft.caption, navigation]);

  const hasImage    = Boolean(draft.imageUri);
  const hasLocation = Boolean(draft.address) && draft.latitude !== null && draft.longitude !== null;
  const canSave     = hasImage && hasLocation && !isFetchingLocation && !isSaving;

  const surfaceBg = isDark ? '#161C26' : '#FFFFFF';
  const inputBg   = isDark ? '#1A2030' : '#F8F6F2';
  const locBg     = isDark ? '#141922' : '#F6F8FA';

  const locBorderColor = locFlash.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? '#232D3E' : '#E0D8CE', '#2E7D32'],
  });

  // Status icon + color
  const statusIcon = canSave
    ? 'checkmark-circle' as const
    : isFetchingLocation
      ? 'hourglass-outline' as const
      : 'ellipsis-horizontal-circle-outline' as const;
  const statusColor = canSave ? (isDark ? '#66BB6A' : '#2E7D32') : isFetchingLocation ? GOLD : colors.textMuted;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── PHOTOGRAPH ── */}
        <Animated.View style={[
          styles.section,
          { backgroundColor: surfaceBg, borderColor: isDark ? '#232D3E' : '#E4DDD4' },
          { opacity: s1Opacity, transform: [{ translateY: s1Y }] },
        ]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: STEEL }]} />
            <Ionicons name="camera-outline" size={14} color={STEEL} />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PHOTOGRAPH</Text>
          </View>

          {hasImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: draft.imageUri! }} style={styles.imagePreview} resizeMode="cover" />
              <View style={styles.previewFooter}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto} disabled={isTakingPhoto}>
                  <Ionicons name="camera-outline" size={13} color="#fff" />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.cameraArea, {
                  backgroundColor: isDark ? '#1A2030' : '#F8F6F2',
                  borderColor: isDark ? '#2A3448' : '#D8D0C8',
                }]}
                onPress={handleTakePhoto}
                disabled={isTakingPhoto || isFetchingLocation}
                activeOpacity={0.7}
              >
                {isTakingPhoto ? (
                  <ActivityIndicator color={STEEL} size="large" />
                ) : (
                  <>
                    <View style={[styles.cameraIconWrap, { backgroundColor: isDark ? '#232D3E' : '#EDE8E0' }]}>
                      <Ionicons name="camera-outline" size={30} color={isDark ? '#4A6080' : '#8A7A6A'} />
                    </View>
                    <Text style={[styles.cameraTitle, { color: colors.text }]}>Add Photo</Text>
                    <Text style={[styles.cameraSub, { color: colors.textMuted }]}>
                      Location will be recorded automatically
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── NOTE ── */}
        <Animated.View style={[
          styles.section,
          { backgroundColor: surfaceBg, borderColor: isDark ? '#232D3E' : '#E4DDD4' },
          { opacity: s2Opacity, transform: [{ translateY: s2Y }] },
        ]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: GOLD }]} />
            <Ionicons name="pencil-outline" size={14} color={GOLD} />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NOTE</Text>
          </View>
          <TextInput
            style={[styles.textInput, {
              color: colors.text,
              backgroundColor: inputBg,
              borderColor: isDark ? '#232D3E' : '#E0D8CE',
            }]}
            placeholder="Write about this moment — where you are, what you feel…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
            value={draft.caption}
            onChangeText={text => setDraft(prev => ({ ...prev, caption: text }))}
          />
          <View style={styles.charCountRow}>
            <Ionicons name="create-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{draft.caption.length} / 200</Text>
          </View>
        </Animated.View>

        {/* ── LOCATION ── */}
        <Animated.View style={[
          styles.section,
          { backgroundColor: surfaceBg, borderColor: isDark ? '#232D3E' : '#E4DDD4' },
          { opacity: s3Opacity, transform: [{ translateY: s3Y }] },
        ]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: ROUGE }]} />
            <Ionicons name="location-outline" size={14} color={ROUGE} />
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LOCATION</Text>
          </View>

          {isFetchingLocation ? (
            <View style={[styles.locationBox, { backgroundColor: locBg }]}>
              <ActivityIndicator color={STEEL} size="small" />
              <Text style={[styles.locationStateText, { color: colors.textSecondary }]}>Detecting location…</Text>
            </View>
          ) : hasLocation ? (
            <Animated.View style={[styles.locationBox, { backgroundColor: locBg, borderColor: locBorderColor, borderWidth: 1 }]}>
              <View style={[styles.pinBadge, { backgroundColor: ROUGE + '18' }]}>
                <Ionicons name="location" size={16} color={ROUGE} />
              </View>
              <View style={styles.locationTexts}>
                <Text style={[styles.locationAddress, { color: colors.text }]}>{draft.address}</Text>
                {draft.latitude !== null && draft.longitude !== null && (
                  <View style={styles.coordsRow}>
                    <Ionicons name="navigate-circle-outline" size={11} color={colors.textMuted} />
                    <Text style={[styles.locationCoords, { color: colors.textMuted }]}>
                      {draft.latitude.toFixed(5)}°, {draft.longitude.toFixed(5)}°
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ) : (
            <View style={[styles.locationBox, { backgroundColor: locBg }]}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.locationStateText, { color: colors.textMuted }]}>
                {hasImage ? 'Could not determine location' : 'Take a photo to record location'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── STATUS ── */}
        {hasImage && (
          <View style={[styles.statusRow, {
            backgroundColor: canSave
              ? (isDark ? '#0D1E10' : '#F2FAF4')
              : isFetchingLocation
                ? (isDark ? '#1A1808' : '#FEFAED')
                : (isDark ? '#161C26' : '#F8F6F2'),
            borderColor: canSave ? '#2E7D3250' : isFetchingLocation ? GOLD + '50' : isDark ? '#232D3E' : '#E4DDD4',
          }]}>
            <Ionicons name={statusIcon} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isFetchingLocation ? 'Fetching location…' : canSave ? 'Ready to save' : 'Awaiting location data'}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── ACTIONS ── */}
      <View style={[styles.actions, {
        backgroundColor: isDark ? '#161C26' : '#FFFFFF',
        borderTopColor: isDark ? '#232D3E' : '#E4DDD4',
      }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, {
            borderColor: isDark ? '#2A3448' : '#D8D0C8',
            backgroundColor: isDark ? '#1A2030' : '#F4F0EA',
          }]}
          onPress={handleDiscard}
          disabled={isSaving}
          activeOpacity={0.75}
        >
          <Ionicons name="close-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.saveBtnWrap, { transform: [{ scale: saveBtnScale }] }]}>
          <TouchableOpacity
            style={[styles.saveBtn, {
              backgroundColor: canSave ? GOLD : (isDark ? '#232D3E' : '#E8E0D8'),
            }]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={canSave ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={canSave ? '#fff' : colors.textMuted}
                />
                <Text style={[styles.saveBtnText, { color: canSave ? '#fff' : colors.textMuted }]}>
                  Save Entry
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 24 },

  section: {
    borderRadius: 12, padding: 16, borderWidth: 1, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent: { width: 3, height: 14, borderRadius: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },

  cameraArea: {
    height: 180, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  cameraIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  cameraTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  cameraSub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },

  imagePreviewWrap: { height: 210, borderRadius: 10, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  previewFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  retakeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  textInput: {
    fontSize: 14, lineHeight: 22, minHeight: 88, textAlignVertical: 'top',
    paddingTop: 12, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1,
  },
  charCountRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'flex-end' },
  charCount: { fontSize: 11 },

  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8 },
  locationStateText: { fontSize: 13, fontWeight: '500' },
  pinBadge: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  locationTexts: { flex: 1, gap: 4 },
  locationAddress: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationCoords: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.3 },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1,
  },
  statusText: { fontSize: 13, fontWeight: '500' },

  actions: {
    flexDirection: 'row', gap: 10, padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14, borderTopWidth: 1,
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 13, paddingHorizontal: 18,
    borderRadius: 8, borderWidth: 1,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtnWrap: { flex: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 8,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
});

export default AddEntryScreen;