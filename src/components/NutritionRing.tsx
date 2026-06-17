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
import type { IconName } from '../types';
import { MacroGlyph } from './MacroGlyph';

export function NutritionRing({
  color,
  progress,
  size,
  icon,
  glyph,
  activeTheme,
}: {
  color: string;
  progress: number;
  size: number;
  icon?: IconName;
  glyph?: 'protein' | 'carbs' | 'fat';
  activeTheme: Theme;
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const arcRotation = `${Math.round(clampedProgress * 250) - 45}deg`;

  return (
    <View
      style={[
        styles.nutritionRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,17,0.06)',
        },
      ]}
    >
      <View
        style={[
          styles.nutritionRingArc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderTopColor: color,
            borderRightColor: color,
            transform: [{ rotate: arcRotation }],
          },
        ]}
      />
      <View
        style={[
          styles.nutritionRingCenter,
          {
            width: size * 0.46,
            height: size * 0.46,
            borderRadius: (size * 0.46) / 2,
            backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(17,17,17,0.035)',
            shadowColor: color,
            shadowOpacity: activeTheme.mode === 'dark' ? 0.26 : 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
          },
        ]}
      >
        {glyph ? <MacroGlyph type={glyph} color={color} size={size * 0.28} /> : icon ? <Ionicons name={icon} size={size * 0.24} color={color} /> : null}
      </View>
    </View>
  );
}
