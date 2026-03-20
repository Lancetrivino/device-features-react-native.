import * as Notifications from 'expo-notifications';
import { TravelEntry } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const sendEntrySavedNotification = async (entry: TravelEntry): Promise<void> => {
  try {
    const shortAddress = entry.address.length > 50
      ? entry.address.substring(0, 47) + '...'
      : entry.address;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✈️ Travel Entry Saved!',
        body: `Your memory at "${shortAddress}" has been saved to your diary.`,
        data: { entryId: entry.id },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('[Notifications] Failed to send notification:', error);
    // Non-fatal: don't throw, saving was already successful
  }
};

export const sendEntryRemovedNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🗑️ Entry Removed',
        body: 'A travel memory has been removed from your diary.',
        sound: false,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('[Notifications] Failed to send removal notification:', error);
  }
};
