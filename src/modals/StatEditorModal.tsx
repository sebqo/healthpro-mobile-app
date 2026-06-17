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

export function StatEditorModal({
  activeTheme,
  visible,
  title,
  value,
  sleepStep,
  calorieStep,
  onChangeSleepStep,
  onChangeCalorieStep,
  onIncrement,
  onDecrement,
  onClose,
}: {
  activeTheme: Theme;
  visible: boolean;
  title: string;
  value: string;
  sleepStep: SleepStep;
  calorieStep: CalorieStep;
  onChangeSleepStep: (step: SleepStep) => void;
  onChangeCalorieStep: (step: CalorieStep) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClose: () => void;
}) {
  const editingSleep = title === 'Sleep';
  const editingCalories = title === 'Calories';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: activeTheme.modalOverlay }]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: activeTheme.modalBg,
              borderColor: activeTheme.cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: activeTheme.titleText }]}>{title}</Text>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={onClose}
              style={[styles.modalCloseButton, { backgroundColor: activeTheme.modalControlBg }]}
            >
              <Ionicons name="close" size={20} color={activeTheme.titleText} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalValueBox, { backgroundColor: activeTheme.modalValueBg }]}>
            <Text style={[styles.modalValue, { color: activeTheme.titleText }]}>{value}</Text>
          </View>

          {(editingSleep || editingCalories) && (
            <View style={[styles.stepSelector, { backgroundColor: activeTheme.modalValueBg }]}>
              {(editingSleep ? [15, 60] : [10, 100]).map((step) => {
                const selected = editingSleep ? sleepStep === step : calorieStep === step;
                const label = editingSleep ? (step === 15 ? '15 min' : '1 hr') : `${step}`;

                return (
                  <TouchableOpacity
                    key={step}
                    activeOpacity={0.82}
                    onPress={() => {
                      if (editingSleep) {
                        onChangeSleepStep(step as SleepStep);
                      } else {
                        onChangeCalorieStep(step as CalorieStep);
                      }
                    }}
                    style={[styles.stepPill, selected && styles.stepPillActive]}
                  >
                    <Text
                      style={[
                        styles.stepText,
                        { color: selected ? '#111111' : activeTheme.mutedText },
                      ]}
                    >
                        {label}
                      </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.modalControls}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={onDecrement}
              style={[styles.adjustButton, { backgroundColor: activeTheme.modalControlBg }]}
            >
              <Ionicons name="remove" size={30} color={activeTheme.titleText} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.82} onPress={onIncrement} style={styles.adjustButtonPrimary}>
              <Ionicons name="add" size={32} color="#111111" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.82} onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
