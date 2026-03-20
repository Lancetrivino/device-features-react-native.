import React, { useState, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
}

const EMPTY_DRAFT: EntryDraft = {
  imageUri: null,
  address: null,
  latitude: null,
  longitude: null,
};

const AddEntryScreen: React.FC = () => {
  const navigation = useNavigation<AddEntryNavProp>();
  const { theme, toggleTheme } = useTheme();
  const { addEntry } = useDiary();
  const { colors, mode } = theme;

  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const savedRef = useRef(false);
  const saveBtnScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse ring when no image yet
  useLayoutEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
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
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: 20 },
      headerLeft: () => (
        <View style={{ marginLeft: 16 }}>
          <Ionicons name="pencil-outline" size={20} color={colors.primary} />
        </View>
      ),
      headerRight: () => <ThemeToggle theme={theme} onToggle={toggleTheme} />,
    });
  }, [navigation, theme, toggleTheme, colors]);

  const fetchLocationForImage = useCallback(async () => {
    setIsFetchingLocation(true);
    try {
      const locGranted = await requestLocationPermission();
      if (!locGranted) {
        Alert.alert('Location Required', 'Location permission is needed to tag your diary entry.');
        setDraft(prev => ({ ...prev, address: 'Location unavailable', latitude: 0, longitude: 0 }));
        return;
      }
      const result = await getCurrentLocation();
      if (!result) {
        Alert.alert('Location Error', 'Could not determine your current location. Please try again.');
        setDraft(prev => ({ ...prev, address: 'Could not get location', latitude: 0, longitude: 0 }));
        return;
      }
      setDraft(prev => ({
        ...prev,
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    } catch (error) {
      console.error('[AddEntry] Location fetch error:', error);
      Alert.alert('Error', 'Failed to fetch location. Please try again.');
    } finally {
      setIsFetchingLocation(false);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (isTakingPhoto || isFetchingLocation) return;
    setIsTakingPhoto(true);
    try {
      const cameraGranted = await requestCameraPermission();
      if (!cameraGranted) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.88,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) { Alert.alert('Error', 'Failed to capture photo. Please try again.'); return; }
      if (!isValidImageUri(asset.uri)) { Alert.alert('Error', 'The captured image URI is invalid.'); return; }
      setDraft(prev => ({ ...prev, imageUri: asset.uri }));
      await fetchLocationForImage();
    } catch (error) {
      console.error('[AddEntry] Camera error:', error);
      Alert.alert('Error', 'An unexpected error occurred while accessing the camera.');
    } finally {
      setIsTakingPhoto(false);
    }
  }, [isTakingPhoto, isFetchingLocation, fetchLocationForImage]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    const validation = validateNewEntry({
      imageUri: draft.imageUri,
      address: draft.address,
      latitude: draft.latitude,
      longitude: draft.longitude,
    });
    if (!validation.isValid) {
      Alert.alert('Cannot Save Entry', validation.errors.join('\n\n'), [{ text: 'OK' }]);
      return;
    }
    Animated.sequence([
      Animated.timing(saveBtnScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
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
      };
      await addEntry(newEntry);
      await sendEntrySavedNotification(newEntry);
      savedRef.current = true;
      setDraft(EMPTY_DRAFT);
      Alert.alert(
        '✈️  Entry Saved!',
        'Your travel memory has been added to your diary.',
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('[AddEntry] Save error:', error);
      Alert.alert('Save Failed', 'Failed to save your travel entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, draft, addEntry, navigation]);

  const handleDiscard = useCallback(() => {
    if (!draft.imageUri) { navigation.goBack(); return; }
    Alert.alert(
      'Discard Entry?',
      'Your current entry will not be saved.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { setDraft(EMPTY_DRAFT); navigation.goBack(); } },
      ]
    );
  }, [draft.imageUri, navigation]);

  const hasImage = Boolean(draft.imageUri);
  const hasLocation = Boolean(draft.address) && draft.latitude !== null && draft.longitude !== null;
  const canSave = hasImage && hasLocation && !isFetchingLocation && !isSaving;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Photo Section ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="camera" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PHOTO</Text>
          </View>

          {hasImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image
                source={{ uri: draft.imageUri! }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              {/* Retake overlay */}
              <View style={[styles.retakeOverlay, { backgroundColor: colors.overlay }]}>
                <TouchableOpacity
                  style={[styles.retakeChip, { borderColor: '#fff' }]}
                  onPress={handleTakePhoto}
                  disabled={isTakingPhoto || isFetchingLocation}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={14} color="#fff" />
                  <Text style={styles.retakeChipText}>
                    {isTakingPhoto ? 'Opening...' : 'Retake Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.cameraBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
              onPress={handleTakePhoto}
              disabled={isTakingPhoto}
              activeOpacity={0.75}
            >
              {isTakingPhoto ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : (
                <>
                  {/* Wrapper keeps ring + circle perfectly centred */}
                  <View style={styles.cameraIconWrapper}>
                    <Animated.View
                      style={[
                        styles.cameraIconRing,
                        { borderColor: colors.primary + '40', transform: [{ scale: pulseAnim }] },
                      ]}
                    />
                    <View style={[styles.cameraIconCircle, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="camera-outline" size={32} color={colors.primary} />
                    </View>
                  </View>
                  <Text style={[styles.cameraBtnTitle, { color: colors.text }]}>
                    Take a Photo
                  </Text>
                  <Text style={[styles.cameraBtnSub, { color: colors.textMuted }]}>
                    Location will be tagged automatically
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Location Section ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="location" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LOCATION</Text>
          </View>

          {isFetchingLocation ? (
            <View style={styles.locationLoading}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={[styles.locationLoadingText, { color: colors.textSecondary }]}>
                Detecting your location...
              </Text>
            </View>
          ) : hasLocation ? (
            <View style={styles.locationResult}>
              <View style={[styles.pinCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <View style={styles.locationTexts}>
                <Text style={[styles.locationAddress, { color: colors.text }]}>
                  {draft.address}
                </Text>
                {draft.latitude !== null && draft.longitude !== null && (
                  <View style={styles.coordRow}>
                    <Ionicons name="navigate-outline" size={11} color={colors.textMuted} />
                    <Text style={[styles.locationCoords, { color: colors.textMuted }]}>
                      {draft.latitude.toFixed(5)}°, {draft.longitude.toFixed(5)}°
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={[styles.locationEmpty, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons
                name={hasImage ? 'warning-outline' : 'location-outline'}
                size={20}
                color={colors.textMuted}
              />
              <Text style={[styles.locationEmptyText, { color: colors.textMuted }]}>
                {hasImage
                  ? 'Could not determine your location'
                  : 'Take a photo to detect your location'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Status pill ── */}
        {hasImage && (
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: canSave ? colors.success + '14' : colors.textMuted + '12',
                borderColor: canSave ? colors.success + '55' : colors.borderLight,
              },
            ]}
          >
            <Ionicons
              name={
                isFetchingLocation
                  ? 'time-outline'
                  : canSave
                  ? 'checkmark-circle-outline'
                  : 'ellipsis-horizontal-circle-outline'
              }
              size={16}
              color={canSave ? colors.success : colors.textMuted}
            />
            <Text style={[styles.statusText, { color: canSave ? colors.success : colors.textMuted }]}>
              {isFetchingLocation
                ? 'Fetching location...'
                : canSave
                ? 'Ready to save your entry!'
                : 'Waiting for location data...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Actions ── */}
      <View
        style={[styles.actions, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}
      >
        {/* Back / Discard */}
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={handleDiscard}
          disabled={isSaving}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
        </TouchableOpacity>

        {/* Save */}
        <Animated.View style={[styles.saveBtnWrap, { transform: [{ scale: saveBtnScale }] }]}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: canSave ? colors.primary : colors.surfaceElevated,
                shadowColor: canSave ? colors.diaryAccent : 'transparent',
              },
            ]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Save this diary entry"
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color={canSave ? '#fff' : colors.textMuted}
                />
                <Text style={[styles.saveBtnText, { color: canSave ? '#fff' : colors.textMuted }]}>
                  Save to Diary
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
  scroll: { padding: 16, gap: 14, paddingBottom: 24 },

  section: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },

  // Camera button
  cameraBtn: {
    height: 196,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  cameraIconWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  cameraIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtnTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  cameraBtnSub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 18,
  },

  // Image preview
  imagePreviewWrap: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  retakeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retakeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  retakeChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Location
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  locationLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  locationTexts: { flex: 1, gap: 4 },
  locationAddress: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationCoords: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.3,
  },
  locationEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  locationEmptyText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtnWrap: { flex: 1 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default AddEntryScreen;