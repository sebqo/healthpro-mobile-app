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

import { ThemeToggle } from '../components/ThemeToggle';

export function ProfileScreen({
  activeTheme,
  isDarkMode,
  onToggleTheme,
}: {
  activeTheme: Theme;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.52, 1]} style={styles.profileContent}>
      <View style={styles.profileHeader}>
        <Text style={[styles.profileTitle, { color: activeTheme.titleText }]}>Profile</Text>
        <View style={[styles.profileAvatar, { backgroundColor: activeTheme.statIconBg }]}>
          <Ionicons name="person" size={30} color={accent} />
        </View>
      </View>

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.cardBorder,
            shadowColor: activeTheme.shadowColor,
          },
        ]}
      >
        <Text style={[styles.profileName, { color: activeTheme.titleText }]}>Simon Spielberg</Text>
        <Text style={[styles.profileMeta, { color: activeTheme.mutedText }]}>HealthPro prototype</Text>
      </View>

      <View
        style={[
          styles.settingCard,
          {
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.cardBorder,
            shadowColor: activeTheme.shadowColor,
          },
        ]}
      >
        <View>
          <Text style={[styles.settingLabel, { color: activeTheme.titleText }]}>Appearance</Text>
          <Text style={[styles.settingHint, { color: activeTheme.mutedText }]}>
            {isDarkMode ? 'Dark mode' : 'Light mode'}
          </Text>
        </View>
        <ThemeToggle activeTheme={activeTheme} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
      </View>
    </LinearGradient>
  );
}
