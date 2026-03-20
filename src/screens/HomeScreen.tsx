import React, { useCallback, useLayoutEffect, useRef, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TravelEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useDiary } from '../context/DiaryContext';
import { EntryCard, EmptyState, ThemeToggle } from '../components';
import { sendEntryRemovedNotification } from '../utils';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HEADER_BG = '#111827';
const GOLD      = '#C9973A';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const { theme, toggleTheme } = useTheme();
  const { entries, removeEntry, isLoading } = useDiary();
  const { colors, mode } = theme;
  const isDark = mode === 'dark';

  // Hero fade-in on mount
  // FAB scale entrance
  const fabScale = useRef(new Animated.Value(0)).current;
  // FAB press
  const fabPressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(fabScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  }, []);

  const handleFabPressIn  = () =>
    Animated.spring(fabPressScale, { toValue: 0.9, friction: 8, useNativeDriver: true }).start();
  const handleFabPressOut = () =>
    Animated.spring(fabPressScale, { toValue: 1,   friction: 5, useNativeDriver: true }).start();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: HEADER_BG,
        height: 110,
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: { color: '#ffffff', fontWeight: '800', fontSize: 30, letterSpacing: -0.5 },
      headerTitleAlign: 'left',
      headerRight: () => (
        <View style={{ marginRight: 4 }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </View>
      ),
    });
  }, [navigation, theme, toggleTheme]);

  const handleRemove = useCallback(async (id: string) => {
    if (!id || typeof id !== 'string') { Alert.alert('Error', 'Cannot remove this entry.'); return; }
    try {
      await removeEntry(id);
      await sendEntryRemovedNotification();
    } catch {
      Alert.alert('Error', 'Failed to remove entry. Please try again.');
    }
  }, [removeEntry]);

  const renderItem = useCallback(({ item }: { item: TravelEntry }) => {
    if (!item || !item.id) return null;
    return <EntryCard entry={item} onRemove={handleRemove} theme={theme} />;
  }, [handleRemove, theme]);

  const keyExtractor = useCallback((item: TravelEntry) => item.id, []);



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} />


      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ flex: 1, backgroundColor: colors.background }}
          ListEmptyComponent={<EmptyState theme={theme} />}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }, { scale: fabPressScale }] }]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: GOLD }]}
          onPress={() => navigation.navigate('AddEntry')}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          activeOpacity={1}
          accessibilityLabel="Add travel entry"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  listContent: { paddingBottom: 150 },
  listContentEmpty: { flex: 1 },


  fabWrap: { position: 'absolute', bottom: 30, right: 24 },
  fab: {
    width: 54, height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 12,
  },
});

export default HomeScreen;