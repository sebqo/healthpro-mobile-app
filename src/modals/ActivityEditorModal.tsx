import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMondayWeekdayIndex, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday, pad2 } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';

export function ActivityEditorModal({
  activeTheme,
  visible,
  draft,
  isEditing,
  onChangeDraft,
  onClose,
  onSave,
  onDelete,
}: {
  activeTheme: Theme;
  visible: boolean;
  draft: ActivityDraft | null;
  isEditing: boolean;
  onChangeDraft: (draft: ActivityDraft | null) => void;
  onClose: () => void;
  onSave: (draft: ActivityDraft) => void;
  onDelete: (activityId: string) => void;
}) {
  const [editingTime, setEditingTime] = useState<EditingTimeTarget>(null);
  const [editingDate, setEditingDate] = useState<EditingDateTarget>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [repeatExpanded, setRepeatExpanded] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(false);
  const [customColorsExpanded, setCustomColorsExpanded] = useState(false);
  const baseColorOptions = [accent, '#2f7df6', '#ffa43b'];
  const customColorSelected = !baseColorOptions.includes(draft?.color ?? '');
  const repeatOptions: Array<{ value: RepeatOption; label: string }> = [
    { value: 'none', label: 'Never' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'custom', label: 'Custom' },
  ];
  const weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  if (!draft) {
    return null;
  }

  const draftStartDate = draft.startDate ?? draft.date;
  const draftEndDate = draft.endDate ?? draftStartDate;
  const activeDateTarget = editingDate ?? 'start';
  const activeDateValue = activeDateTarget === 'start' ? draftStartDate : draftEndDate;
  const activitySheetBackground =
    activeTheme.mode === 'dark' ? 'rgba(32,35,38,0.92)' : 'rgba(255,255,255,0.92)';

  const updateDraft = (changes: Partial<ActivityDraft>) => {
    onChangeDraft(normalizeActivityDraft({ ...draft, ...changes }));
  };

  const normalizeDraftTimes = (nextDraft: ActivityDraft) => {
    return normalizeActivityDraft(nextDraft);
  };

  const updateTime = (target: Exclude<EditingTimeTarget, null>, minutes: number) => {
    const changedTime = adjustTime(target === 'start' ? draft.startTime : draft.endTime, minutes);
    const nextDraft = normalizeDraftTimes({
      ...draft,
      [target === 'start' ? 'startTime' : 'endTime']: changedTime,
    });

    onChangeDraft(nextDraft);
  };

  const updateTimePart = (target: Exclude<EditingTimeTarget, null>, part: 'hours' | 'minutes', value: string) => {
    const currentTime = target === 'start' ? draft.startTime : draft.endTime;
    const parts = getTimeParts(currentTime);
    const nextTime = buildTime(
      part === 'hours' ? normalizeTimePart(value, 23) : parts.hours,
      part === 'minutes' ? normalizeTimePart(value, 59) : parts.minutes,
    );
    const nextDraft = normalizeDraftTimes({
      ...draft,
      [target === 'start' ? 'startTime' : 'endTime']: nextTime,
    });

    onChangeDraft(nextDraft);
  };

  const updateRepeat = (repeat: RepeatOption) => {
    updateDraft({
      repeat,
      customWeekdays:
        repeat === 'custom' && (!draft.customWeekdays || draft.customWeekdays.length === 0)
          ? [getMondayWeekdayIndex(draftStartDate)]
          : draft.customWeekdays,
    });
  };

  const updateActivityDate = (date: string) => {
    const editingStartDate = activeDateTarget === 'start';

    updateDraft({
      date: editingStartDate ? date : draftStartDate,
      startDate: editingStartDate ? date : draftStartDate,
      endDate: editingStartDate ? draftEndDate : date,
      customWeekdays:
        draft.repeat === 'custom' && (!draft.customWeekdays || draft.customWeekdays.length === 0)
          ? [getMondayWeekdayIndex(editingStartDate ? date : draftStartDate)]
          : draft.customWeekdays,
    });
  };

  const toggleCustomWeekday = (weekday: number) => {
    const current = draft.customWeekdays && draft.customWeekdays.length > 0
      ? draft.customWeekdays
      : [getMondayWeekdayIndex(draftStartDate)];
    const next = current.includes(weekday)
      ? current.filter((day) => day !== weekday)
      : [...current, weekday].sort((a, b) => a - b);

    updateDraft({
      repeat: 'custom',
      customWeekdays: next.length > 0 ? next : [getMondayWeekdayIndex(draftStartDate)],
    });
  };

  const saveDraft = () => {
    const savedDraft = {
      ...draft,
      title: draft.title.trim() || 'Untitled Activity',
      description: draft.description.trim(),
    };

    onChangeDraft(savedDraft);
    setEditingTime(null);
    setEditingDate(null);
    setConfirmDelete(false);
    setRepeatExpanded(false);
    setDateExpanded(false);
    setCustomColorsExpanded(false);
    onSave(savedDraft);
  };

  const toggleDateSelector = (target: Exclude<EditingDateTarget, null>) => {
    const shouldOpen = !(dateExpanded && editingDate === target);
    setEditingDate(shouldOpen ? target : null);
    setDateExpanded(shouldOpen);
    setEditingTime(null);
    setRepeatExpanded(false);
    setCustomColorsExpanded(false);
  };

  const toggleTimeEditor = (target: Exclude<EditingTimeTarget, null>) => {
    const nextTarget = editingTime === target ? null : target;
    setEditingTime(nextTarget);
    setEditingDate(null);
    setDateExpanded(false);
    setRepeatExpanded(false);
    setCustomColorsExpanded(false);
  };

  const toggleCustomColors = () => {
    const shouldOpen = !customColorsExpanded;
    setCustomColorsExpanded(shouldOpen);
    setEditingTime(null);
    setEditingDate(null);
    setDateExpanded(false);
    setRepeatExpanded(false);
  };

  const toggleRepeatOptions = () => {
    const shouldOpen = !repeatExpanded;
    setRepeatExpanded(shouldOpen);
    setEditingTime(null);
    setEditingDate(null);
    setDateExpanded(false);
    setCustomColorsExpanded(false);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.activityModalOverlay, { backgroundColor: activeTheme.modalOverlay }]}>
        <View
          style={[
            styles.activitySheet,
            {
              backgroundColor: activitySheetBackground,
              borderColor: activeTheme.cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: activeTheme.divider }]} />

          <View style={styles.sheetHeader}>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => {
                setEditingTime(null);
                setEditingDate(null);
                setConfirmDelete(false);
                setRepeatExpanded(false);
                setDateExpanded(false);
                setCustomColorsExpanded(false);
                onClose();
              }}
              style={[styles.sheetRoundButton, { backgroundColor: activeTheme.modalControlBg }]}
            >
              <Ionicons name="close" size={24} color={accent} />
            </TouchableOpacity>

            <Text style={[styles.sheetTitle, { color: activeTheme.titleText }]}>Productivity</Text>

            <TouchableOpacity activeOpacity={0.82} onPress={saveDraft} style={styles.sheetSaveButton}>
              <Ionicons name="checkmark" size={27} color="#111111" />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.activityInputCard,
              {
                backgroundColor: activeTheme.modalValueBg,
                borderColor: activeTheme.cardBorder,
              },
            ]}
          >
            <TextInput
              value={draft.title}
              onChangeText={(title) => updateDraft({ title })}
              placeholder="Title"
              placeholderTextColor={activeTheme.mutedText}
              style={[styles.activityTitleInput, { color: activeTheme.titleText, borderBottomColor: accent }]}
            />
            <TextInput
              value={draft.description}
              onChangeText={(description) => updateDraft({ description })}
              placeholder="Description"
              placeholderTextColor={activeTheme.mutedText}
              multiline
              style={[styles.activityDescriptionInput, { color: activeTheme.titleText }]}
            />
          </View>

          <View
            style={[
              styles.activityFormCard,
              {
                backgroundColor: activeTheme.modalValueBg,
                borderColor: activeTheme.cardBorder,
              },
            ]}
          >
            <View style={styles.activityFormRow}>
              <Text style={[styles.formRowLabel, { color: activeTheme.titleText }]}>All-day</Text>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => updateDraft({ allDay: !draft.allDay })}
                style={[
                  styles.allDaySwitch,
                  { backgroundColor: draft.allDay ? accent : activeTheme.modalControlBg },
                ]}
              >
                <View
                  style={[
                    styles.allDayKnob,
                    {
                      backgroundColor: activeTheme.mode === 'dark' ? '#f4f4f2' : '#ffffff',
                      transform: [{ translateX: draft.allDay ? 28 : 0 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.activityFormRow, styles.formDivider, { borderTopColor: activeTheme.divider }]}>
              <Text
                style={[
                  styles.formRowLabel,
                  { color: editingTime === 'start' || (dateExpanded && editingDate === 'start') ? accent : activeTheme.titleText },
                ]}
              >
                Starts
              </Text>
              <View style={styles.formChips}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => toggleDateSelector('start')}
                  style={[styles.formChip, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Text style={styles.formChipText}>{formatDateChip(draftStartDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => toggleTimeEditor('start')}
                  style={[
                    styles.formChip,
                    editingTime === 'start' && styles.formChipActive,
                    { backgroundColor: editingTime === 'start' ? accent : activeTheme.modalControlBg },
                  ]}
                >
                  <Text style={[styles.formChipText, editingTime === 'start' && styles.formChipTextActive]}>
                    {draft.startTime}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.activityFormRow, styles.formDivider, { borderTopColor: activeTheme.divider }]}>
              <Text
                style={[
                  styles.formRowLabel,
                  { color: editingTime === 'end' || (dateExpanded && editingDate === 'end') ? accent : activeTheme.titleText },
                ]}
              >
                Ends
              </Text>
              <View style={styles.formChips}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => toggleDateSelector('end')}
                  style={[styles.formChip, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Text style={styles.formChipText}>{formatDateChip(draftEndDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => toggleTimeEditor('end')}
                  style={[
                    styles.formChip,
                    editingTime === 'end' && styles.formChipActive,
                    { backgroundColor: editingTime === 'end' ? accent : activeTheme.modalControlBg },
                  ]}
                >
                  <Text style={[styles.formChipText, editingTime === 'end' && styles.formChipTextActive]}>
                    {draft.endTime}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {dateExpanded && (
              <View style={[styles.dateSelector, { borderTopColor: activeTheme.divider }]}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => updateActivityDate(addDays(activeDateValue, -1))}
                  style={[styles.dateStepButton, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Ionicons name="chevron-back" size={18} color={activeTheme.titleText} />
                </TouchableOpacity>
                <View style={[styles.dateSelectorLabel, { backgroundColor: activeTheme.modalControlBg }]}>
                  <Text style={[styles.dateSelectorText, { color: activeTheme.titleText }]}>
                    {formatDateChip(activeDateValue)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => updateActivityDate(getTodayISO())}
                  style={styles.dateTodayButton}
                >
                  <Text style={styles.dateTodayText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => updateActivityDate(addDays(activeDateValue, 1))}
                  style={[styles.dateStepButton, { backgroundColor: activeTheme.modalControlBg }]}
                >
                  <Ionicons name="chevron-forward" size={18} color={activeTheme.titleText} />
                </TouchableOpacity>
              </View>
            )}

            {editingTime && (
              <View style={[styles.timeEditor, { borderTopColor: activeTheme.divider }]}>
                <Text style={[styles.timeEditorLabel, { color: activeTheme.mutedText }]}>
                  {editingTime === 'start' ? 'Start time' : 'End time'}
                </Text>
                <View style={styles.timeFieldRow}>
                  <View style={styles.timeUnitBlock}>
                    <TouchableOpacity
                      activeOpacity={0.78}
                      onPress={() => updateTime(editingTime, 60)}
                      style={[styles.timeNudgeButton, { backgroundColor: activeTheme.modalControlBg }]}
                    >
                      <Ionicons name="add" size={17} color={activeTheme.titleText} />
                    </TouchableOpacity>
                    <TextInput
                      keyboardType="number-pad"
                      value={pad2(getTimeParts(editingTime === 'start' ? draft.startTime : draft.endTime).hours)}
                      onChangeText={(value) => updateTimePart(editingTime, 'hours', value)}
                      maxLength={2}
                      style={[
                        styles.timeNumberInput,
                        {
                          color: activeTheme.titleText,
                          backgroundColor: activeTheme.modalControlBg,
                        },
                      ]}
                    />
                    <TouchableOpacity
                      activeOpacity={0.78}
                      onPress={() => updateTime(editingTime, -60)}
                      style={[styles.timeNudgeButton, { backgroundColor: activeTheme.modalControlBg }]}
                    >
                      <Ionicons name="remove" size={17} color={activeTheme.titleText} />
                    </TouchableOpacity>
                    <Text style={[styles.timeUnitLabel, { color: activeTheme.mutedText }]}>Hour</Text>
                  </View>

                  <Text style={[styles.timeColon, { color: activeTheme.titleText }]}>:</Text>

                  <View style={styles.timeUnitBlock}>
                    <TouchableOpacity
                      activeOpacity={0.78}
                      onPress={() => updateTime(editingTime, 1)}
                      style={[styles.timeNudgeButton, { backgroundColor: activeTheme.modalControlBg }]}
                    >
                      <Ionicons name="add" size={17} color={activeTheme.titleText} />
                    </TouchableOpacity>
                    <TextInput
                      keyboardType="number-pad"
                      value={pad2(getTimeParts(editingTime === 'start' ? draft.startTime : draft.endTime).minutes)}
                      onChangeText={(value) => updateTimePart(editingTime, 'minutes', value)}
                      maxLength={2}
                      style={[
                        styles.timeNumberInput,
                        {
                          color: activeTheme.titleText,
                          backgroundColor: activeTheme.modalControlBg,
                        },
                      ]}
                    />
                    <TouchableOpacity
                      activeOpacity={0.78}
                      onPress={() => updateTime(editingTime, -1)}
                      style={[styles.timeNudgeButton, { backgroundColor: activeTheme.modalControlBg }]}
                    >
                      <Ionicons name="remove" size={17} color={activeTheme.titleText} />
                    </TouchableOpacity>
                    <Text style={[styles.timeUnitLabel, { color: activeTheme.mutedText }]}>Minute</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.activityFormRow, styles.formDivider, { paddingTop: 5, paddingBottom: 7, borderTopColor: activeTheme.divider }]}>
              <Text style={[styles.formRowLabel, { color: customColorsExpanded ? accent : activeTheme.titleText }]}>
                Color
              </Text>
              <View style={styles.colorSelectorWrap}>
                <View style={styles.colorOptions}>
                  {baseColorOptions.map((color) => {
                    const selected = draft.color === color;

                    return (
                      <TouchableOpacity
                        key={color}
                        activeOpacity={0.82}
                        onPress={() => {
                          setCustomColorsExpanded(false);
                          updateDraft({ color });
                        }}
                        style={[styles.colorButton, selected && { borderColor: color }]}
                      >
                        <View style={[styles.colorDot, { backgroundColor: color }]} />
                        {selected && (
                          <View style={styles.colorCheckBadge}>
                            <Ionicons name="checkmark" size={11} color="#111111" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={toggleCustomColors}
                    style={[
                      styles.colorButton,
                      (customColorsExpanded || customColorSelected) && { borderColor: draft.color },
                    ]}
                  >
                    <View style={styles.customColorCircle}>
                      <View style={[styles.customColorPart, styles.customColorPartOne]} />
                      <View style={[styles.customColorPart, styles.customColorPartTwo]} />
                      <View style={[styles.customColorPart, styles.customColorPartThree]} />
                      <View style={[styles.customColorPart, styles.customColorPartFour]} />
                    </View>
                    {(customColorsExpanded || customColorSelected) && (
                      <View style={styles.colorCheckBadge}>
                        <Ionicons name="checkmark" size={11} color="#111111" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                {customColorsExpanded && (
                  <View style={styles.expandedColorPalette}>
                    {activityColorPalette.map((color) => {
                      const selected = draft.color === color;

                      return (
                        <TouchableOpacity
                          key={color}
                          activeOpacity={0.82}
                          onPress={() => updateDraft({ color })}
                          style={[styles.paletteColorButton, selected && { borderColor: color }]}
                        >
                          <View style={[styles.paletteColorDot, { backgroundColor: color }]} />
                          {selected && (
                            <View style={styles.colorCheckBadge}>
                              <Ionicons name="checkmark" size={10} color="#111111" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.repeatCard,
              {
                backgroundColor: activeTheme.modalValueBg,
                borderColor: activeTheme.cardBorder,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={toggleRepeatOptions}
              style={styles.repeatHeaderRow}
            >
              <Text style={[styles.formRowLabel, { color: repeatExpanded ? accent : activeTheme.titleText }]}>
                Repeat
              </Text>
              <View style={styles.repeatValueRow}>
                <Text style={styles.repeatValue}>
                  {repeatOptions.find((option) => option.value === draft.repeat)?.label ?? 'Never'}
                </Text>
                <Ionicons
                  name={repeatExpanded ? 'chevron-up' : 'chevron-down'}
                  size={21}
                  color={activeTheme.mutedText}
                />
              </View>
            </TouchableOpacity>

            {repeatExpanded && (
              <View style={[styles.repeatOptions, { borderTopColor: activeTheme.divider }]}>
                <View style={styles.repeatOptionGrid}>
                  {repeatOptions.map((option) => {
                    const selected = draft.repeat === option.value;

                    return (
                      <TouchableOpacity
                        key={option.value}
                        activeOpacity={0.82}
                        onPress={() => updateRepeat(option.value)}
                        style={[
                          styles.repeatOptionButton,
                          {
                            backgroundColor: selected ? accent : activeTheme.modalControlBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.repeatOptionText,
                            { color: selected ? '#111111' : activeTheme.titleText },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {draft.repeat === 'custom' && (
                  <View style={styles.weekdayChips}>
                    {weekdayLabels.map((label, index) => {
                      const selected = (draft.customWeekdays ?? [getMondayWeekdayIndex(draftStartDate)]).includes(index);

                      return (
                        <TouchableOpacity
                          key={label}
                          activeOpacity={0.82}
                          onPress={() => toggleCustomWeekday(index)}
                          style={[
                            styles.weekdayChip,
                            {
                              backgroundColor: selected ? accent : activeTheme.modalControlBg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.weekdayChipText,
                              { color: selected ? '#111111' : activeTheme.titleText },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>

          {isEditing && (
            <View style={styles.deleteSection}>
              {confirmDelete ? (
                <View style={styles.deleteConfirmRow}>
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() => setConfirmDelete(false)}
                    style={[styles.deleteCancelButton, { backgroundColor: activeTheme.modalControlBg }]}
                  >
                    <Text style={[styles.deleteCancelText, { color: activeTheme.titleText }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() => {
                      setEditingTime(null);
                      setEditingDate(null);
                      setConfirmDelete(false);
                      setRepeatExpanded(false);
                      setDateExpanded(false);
                      setCustomColorsExpanded(false);
                      onDelete(draft.id);
                    }}
                    style={styles.deleteConfirmButton}
                  >
                    <Text style={styles.deleteConfirmText}>Delete activity</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => setConfirmDelete(true)}
                  style={[
                    styles.deleteButton,
                    {
                      backgroundColor: activeTheme.modalValueBg,
                      borderColor: activeTheme.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff5d5d" />
                  <Text style={styles.deleteButtonText}>Delete activity</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
