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

export function MealEditorModal({
  activeTheme,
  visible,
  draft,
  isEditing,
  onChangeDraft,
  onClose,
  onSave,
  onDelete,
  onScan,
}: {
  activeTheme: Theme;
  visible: boolean;
  draft: Meal | null;
  isEditing: boolean;
  onChangeDraft: (draft: Meal) => void;
  onClose: () => void;
  onSave: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  onScan: () => void;
}) {
  if (!draft) {
    return null;
  }

  const updateDraft = (updates: Partial<Meal>) => onChangeDraft({ ...draft, ...updates });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.activityModalOverlay, { backgroundColor: activeTheme.modalOverlay }]}>
        <View
          style={[
            styles.mealSheet,
            {
              backgroundColor: activeTheme.mode === 'dark' ? 'rgba(32,35,38,0.94)' : 'rgba(255,255,255,0.96)',
              borderColor: activeTheme.cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.mealSheetHeader}>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={onClose}
              style={[styles.sheetRoundButton, { backgroundColor: activeTheme.modalControlBg }]}
            >
              <Ionicons name="close" size={23} color={accent} />
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: activeTheme.titleText }]}>Manual meal</Text>
            <TouchableOpacity activeOpacity={0.78} onPress={() => onSave(draft)} style={styles.sheetSaveButton}>
              <Ionicons name="checkmark" size={24} color="#111111" />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.mealInputCard,
              {
                backgroundColor: activeTheme.modalValueBg,
                borderColor: activeTheme.cardBorder,
              },
            ]}
          >
            <TextInput
              value={draft.name}
              onChangeText={(name) => updateDraft({ name })}
              placeholder="Meal name"
              placeholderTextColor={activeTheme.mutedText}
              style={[styles.mealNameInput, { color: activeTheme.titleText, borderBottomColor: accent }]}
            />
            <View style={styles.mealFieldGrid}>
              {[
                { key: 'calories', label: 'Calories' },
                { key: 'protein', label: 'Protein g' },
                { key: 'carbs', label: 'Carbs g' },
                { key: 'fat', label: 'Fat g' },
              ].map((field) => (
                <View key={field.key} style={styles.mealField}>
                  <Text style={[styles.mealFieldLabel, { color: activeTheme.secondaryText }]}>{field.label}</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(draft[field.key as keyof Pick<Meal, 'calories' | 'protein' | 'carbs' | 'fat'>])}
                    onChangeText={(value) => updateDraft({ [field.key]: clampMacroInput(value) } as Partial<Meal>)}
                    style={[
                      styles.mealNumberInput,
                      {
                        color: activeTheme.titleText,
                        backgroundColor: activeTheme.modalControlBg,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.mealMetaCard,
              {
                backgroundColor: activeTheme.modalValueBg,
                borderColor: activeTheme.cardBorder,
              },
            ]}
          >
            <View style={styles.mealMetaRow}>
              <Text style={[styles.formRowLabel, { color: activeTheme.titleText }]}>Date</Text>
              <View style={styles.mealDateControls}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => updateDraft({ date: addDays(draft.date, -1) })}
                  style={[styles.dateStepButton, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Ionicons name="chevron-back" size={18} color={activeTheme.titleText} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => updateDraft({ date: getTodayISO() })}
                  style={[styles.mealTodayChip, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Text style={[styles.formChipText, { color: activeTheme.titleText }]}>{formatDateChip(draft.date)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => updateDraft({ date: addDays(draft.date, 1) })}
                  style={[styles.dateStepButton, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Ionicons name="chevron-forward" size={18} color={activeTheme.titleText} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mealMetaRow}>
              <Text style={[styles.formRowLabel, { color: activeTheme.titleText }]}>Time</Text>
              <TextInput
                value={draft.time}
                onChangeText={(time) => updateDraft({ time })}
                onBlur={() => updateDraft({ time: formatTimeFromMinutes(safeParseMinutes(draft.time, getCurrentLocalMinutes())) })}
                placeholder="12:30"
                placeholderTextColor={activeTheme.mutedText}
                style={[
                  styles.mealTimeInput,
                  {
                    color: activeTheme.titleText,
                    backgroundColor: activeTheme.modalControlBg,
                  },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onScan}
            style={[styles.scannerSoonButton, { backgroundColor: activeTheme.modalValueBg, borderColor: activeTheme.cardBorder }]}
          >
            <Ionicons name="scan-outline" size={17} color={accent} />
            <Text style={[styles.scannerSoonText, { color: activeTheme.titleText }]}>Scan</Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => onDelete(draft.id)}
              style={[
                  styles.deleteButton,
                  styles.mealDeleteButton,
                  {
                    backgroundColor: activeTheme.modalValueBg,
                  borderColor: activeTheme.cardBorder,
                },
              ]}
            >
              <Ionicons name="trash-outline" size={18} color="#ff5d5d" />
              <Text style={styles.deleteButtonText}>Delete meal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
