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

export function MacroGlyph({ type, color, size }: { type: 'protein' | 'carbs' | 'fat'; color: string; size: number }) {
  if (type === 'fat') {
    return (
      <View style={[styles.fatGlyph, { width: size * 1.25, height: size }]}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <View
            key={`fat-${index}`}
            style={[
              styles.fatBubble,
              {
                backgroundColor: color,
                width: size * (index < 3 ? 0.42 : 0.36),
                height: size * (index < 3 ? 0.42 : 0.36),
                borderRadius: size * 0.22,
                left: [0.04, 0.36, 0.68, 0.2, 0.5, 0.74][index] * size,
                top: [0.04, 0, 0.17, 0.42, 0.38, 0.55][index] * size,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (type === 'carbs') {
    return (
      <View style={[styles.carbsGlyph, { width: size, height: size }]}>
        <View style={[styles.carbsStem, { backgroundColor: color }]} />
        {[0, 1, 2].map((index) => (
          <View
            key={`grain-left-${index}`}
            style={[
              styles.grainLeft,
              {
                backgroundColor: color,
                top: size * (0.18 + index * 0.22),
              },
            ]}
          />
        ))}
        {[0, 1, 2].map((index) => (
          <View
            key={`grain-right-${index}`}
            style={[
              styles.grainRight,
              {
                backgroundColor: color,
                top: size * (0.18 + index * 0.22),
              },
            ]}
          />
        ))}
      </View>
    );
  }

  return <Ionicons name="fish-outline" size={size} color={color} />;
}
