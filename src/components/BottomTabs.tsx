import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';

import { tabs } from '../constants/tabs';

export function BottomTabs({
  activeTab,
  onChange,
  activeTheme,
  onQrPress,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  activeTheme: Theme;
  onQrPress: () => void;
}) {
  const dark = activeTheme.mode === 'dark';
  const showQrButton = activeTab === 'Nutrition';

  return (
    <View
      style={[
        styles.tabBar,
        dark ? styles.darkTabBar : styles.lightTabBar,
        showQrButton && styles.tabBarWithQr,
        {
          backgroundColor: activeTheme.tabBg,
          borderTopColor: activeTheme.divider,
          shadowColor: activeTheme.shadowColor,
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const active = tab.key === activeTab;
        const color = active ? accent : activeTheme.tabMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.76}
            style={[
              styles.tabButton,
              showQrButton && index === 1 && styles.tabButtonBeforeQr,
              showQrButton && index === 2 && styles.tabButtonAfterQr,
            ]}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons name={active ? tab.activeIcon : tab.icon} size={25} color={color} />
            <Text style={[styles.tabText, { color: active ? accent : activeTheme.tabText }]}>{tab.key}</Text>
          </TouchableOpacity>
        );
      })}
      {showQrButton && (
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={onQrPress}
          style={[
            styles.tabQrButton,
            {
              backgroundColor: activeTheme.mode === 'dark' ? 'rgba(31,33,35,0.94)' : 'rgba(255,255,255,0.96)',
              borderColor: accent,
              shadowColor: accent,
            },
          ]}
        >
          <Ionicons name="qr-code-outline" size={28} color={activeTheme.mode === 'dark' ? '#ffffff' : '#111111'} />
        </TouchableOpacity>
      )}
      <View style={[styles.homeIndicator, { backgroundColor: activeTheme.homeIndicator }]} />
    </View>
  );
}
