import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// ─── Camera Permission (via expo-image-picker) ────────────────────────────────

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Denied',
        'Travel Diary needs camera access to capture your travel memories. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Permissions] Camera permission error:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

// ─── Location Permission ──────────────────────────────────────────────────────

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Denied',
        'Travel Diary needs location access to tag your travel entries with addresses. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Permissions] Location permission error:', error);
    return false;
  }
};

export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

// ─── Notification Permission ──────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('travel-diary', {
        name: 'Travel Diary',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4f8ef7',
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notification Permission Denied',
        'Travel Diary needs notification permission to alert you when entries are saved. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Permissions] Notification permission error:', error);
    return false;
  }
};

// ─── Request All ──────────────────────────────────────────────────────────────

export const requestAllPermissions = async (): Promise<{
  camera: boolean;
  location: boolean;
  notifications: boolean;
}> => {
  const camera = await requestCameraPermission();
  const location = await requestLocationPermission();
  const notifications = await requestNotificationPermission();
  return { camera, location, notifications };
};