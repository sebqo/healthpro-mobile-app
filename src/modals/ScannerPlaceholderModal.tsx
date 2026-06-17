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

export function ScannerPlaceholderModal({
  activeTheme,
  visible,
  onClose,
}: {
  activeTheme: Theme;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: activeTheme.modalOverlay }]}>
        <View
          style={[
            styles.scannerPlaceholderCard,
            {
              backgroundColor: activeTheme.modalBg,
              borderColor: activeTheme.cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <View style={[styles.scannerPlaceholderIcon, { backgroundColor: activeTheme.modalValueBg }]}>
            <Ionicons name="qr-code-outline" size={34} color={accent} />
          </View>
          <Text style={[styles.scannerPlaceholderTitle, { color: activeTheme.titleText }]}>Scanner coming soon</Text>
          <Text style={[styles.scannerPlaceholderText, { color: activeTheme.secondaryText }]}>
            Future QR/barcode package scan will live here.
          </Text>
          <TouchableOpacity activeOpacity={0.82} onPress={onClose} style={styles.scannerPlaceholderDone}>
            <Text style={styles.scannerPlaceholderDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
