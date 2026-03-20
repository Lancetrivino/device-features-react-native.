import React, { useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TravelEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useDiary } from '../context/DiaryContext';
import { EntryCard, EmptyState, ThemeToggle } from '../components';
import { sendEntryRemovedNotification } from '../utils';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const { theme, toggleTheme } = useTheme();
  const { entries, removeEntry, isLoading } = useDiary();
  const { colors, mode } = theme;

  const fabScale = useRef(new Animated.Value(1)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Travel Diary',
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        color: colors.text,
        fontWeight: '800',
        fontSize: 20,
        letterSpacing: 0.2,
      },
      headerLeft: () => (
        <View style={{ marginLeft: 16, marginRight: 4 }}>
          <Ionicons name="book-outline" size={22} color={colors.primary} />
        </View>
      ),
      headerRight: () => <ThemeToggle theme={theme} onToggle={toggleTheme} />,
    });
  }, [navigation, theme, toggleTheme, colors]);

  const handleRemove = useCallback(async (id: string) => {
    if (!id || typeof id !== 'string') {
      Alert.alert('Error', 'Cannot remove this entry: invalid ID.');
      return;
    }
    try {
      await removeEntry(id);
      await sendEntryRemovedNotification();
    } catch (error) {
      console.error('[HomeScreen] Failed to remove entry:', error);
      Alert.alert('Error', 'Failed to remove entry. Please try again.');
    }
  }, [removeEntry]);

  const renderItem = useCallback(({ item }: { item: TravelEntry }) => {
    if (!item || !item.id) return null;
    return <EntryCard entry={item} onRemove={handleRemove} theme={theme} />;
  }, [handleRemove, theme]);

  const keyExtractor = useCallback((item: TravelEntry) => item.id, []);

  const onFabPressIn = () =>
    Animated.spring(fabScale, { toValue: 0.93, useNativeDriver: true, friction: 8 }).start();
  const onFabPressOut = () =>
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

  const ListHeader = () => (
    <View style={[styles.listHeader, { borderBottomColor: colors.borderLight }]}>
      <Ionicons name="earth-outline" size={14} color={colors.textMuted} />
      <Text style={[styles.entryCount, { color: colors.textMuted }]}>
        {entries.length === 0
          ? 'No entries yet — start exploring!'
          : `${entries.length} ${entries.length === 1 ? 'journey' : 'journeys'} recorded`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      {/* Subtle ambient blobs */}
      <View
        style={[
          styles.blob,
          styles.blobTopRight,
          { backgroundColor: colors.diaryGlow },
        ]}
        pointerEvents="none"
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingRing, { borderColor: colors.primary }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your diary...
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<EmptyState theme={theme} />}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Animated.View
        style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}
      >
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.diaryAccent,
            },
          ]}
          onPress={() => navigation.navigate('AddEntry')}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
          accessibilityLabel="Add a new travel entry"
          accessibilityRole="button"
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.fabText}>New Entry</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  blob: {
    position: 'absolute',
    borderRadius: 999,
    pointerEvents: 'none',
  },
  blobTopRight: {
    width: 220,
    height: 220,
    top: -80,
    right: -80,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  loadingRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  listContent: { paddingBottom: 108 },
  listContentEmpty: { flex: 1 },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  entryCount: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  fabWrap: {
    position: 'absolute',
    bottom: 26,
    left: 20,
    right: 20,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 12,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;