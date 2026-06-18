import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMondayWeekdayIndex, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';

import { WeekTimeline } from '../components/WeekTimeline';

export function CalendarScreen({
  activeTheme,
  activities,
  selectedDate,
  visibleMonthDate,
  activityViewMode,
  weekZoom,
  onSelectDate,
  onChangeVisibleMonthDate,
  onChangeActivityViewMode,
  onChangeWeekZoom,
  onGoToToday,
  onNewActivity,
  onEditActivity,
}: {
  activeTheme: Theme;
  activities: Activity[];
  selectedDate: string;
  visibleMonthDate: string;
  activityViewMode: ActivityViewMode;
  weekZoom: number;
  onSelectDate: (date: string) => void;
  onChangeVisibleMonthDate: (date: string) => void;
  onChangeActivityViewMode: (mode: ActivityViewMode) => void;
  onChangeWeekZoom: (zoom: number | ((value: number) => number)) => void;
  onGoToToday: () => void;
  onNewActivity: () => void;
  onEditActivity: (activity: Activity) => void;
}) {
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedActivities = getActivitiesForDate(activities, selectedDate);
  const calendarDays = getCalendarDays(visibleMonthDate, selectedDate);
  const calendarWeekRows = Array.from({ length: 5 }, (_, index) => calendarDays.slice(index * 7, index * 7 + 7));
  const weekDays = getWeekDays(selectedDate);
  const calendarTitle = activityViewMode === 'week' ? getMonthTitle(selectedDate) : getMonthTitle(visibleMonthDate);

  const selectCalendarDate = (dateString: string, isCurrentMonth: boolean) => {
    onSelectDate(dateString);

    if (!isCurrentMonth) {
      onChangeVisibleMonthDate(getMonthStartISO(dateString));
    }
  };

  const moveCalendarBackward = () => {
    if (activityViewMode === 'week') {
      const nextSelectedDate = addDays(selectedDate, -7);
      onSelectDate(nextSelectedDate);
      onChangeVisibleMonthDate(getMonthStartISO(nextSelectedDate));
      return;
    }

    onChangeVisibleMonthDate(addMonths(visibleMonthDate, -1));
  };

  const moveCalendarForward = () => {
    if (activityViewMode === 'week') {
      const nextSelectedDate = addDays(selectedDate, 7);
      onSelectDate(nextSelectedDate);
      onChangeVisibleMonthDate(getMonthStartISO(nextSelectedDate));
      return;
    }

    onChangeVisibleMonthDate(addMonths(visibleMonthDate, 1));
  };

  return (
    <View style={[styles.calendarContent, { backgroundColor: activeTheme.calendarBg }]}>
      <View style={[styles.screenHeaderRow, styles.calendarTop]}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={moveCalendarBackward}
            style={[styles.monthNavButton, { backgroundColor: activeTheme.iconButtonBg }]}
          >
            <Ionicons name="chevron-back" size={18} color={activeTheme.titleText} />
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[styles.monthTitle, { color: activeTheme.mutedText }]}
          >
            {calendarTitle}
          </Text>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={moveCalendarForward}
            style={[styles.monthNavButton, { backgroundColor: activeTheme.iconButtonBg }]}
          >
            <Ionicons name="chevron-forward" size={18} color={activeTheme.titleText} />
          </TouchableOpacity>
        </View>
        <View style={[styles.screenHeaderActions, styles.calendarActions]}>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={onGoToToday}
            style={[
              styles.todayButton,
              {
                backgroundColor: activeTheme.iconButtonBg,
                borderColor: activeTheme.iconButtonBorder,
              },
            ]}
          >
            <Text style={[styles.todayButtonText, { color: activeTheme.iconButtonColor }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => onChangeActivityViewMode(activityViewMode === 'month' ? 'week' : 'month')}
            style={[
              styles.filterButton,
              {
                backgroundColor: activeTheme.iconButtonBg,
                borderColor: activeTheme.iconButtonBorder,
              },
            ]}
          >
            <Ionicons
              name={activityViewMode === 'month' ? 'calendar-outline' : 'today-outline'}
              size={18}
              color={activeTheme.iconButtonColor}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onNewActivity}
            style={[styles.topActionButton, styles.calendarFixedAddButton]}
          >
            <Ionicons name="add" size={25} color="#111111" />
          </TouchableOpacity>
        </View>
      </View>

      {activityViewMode === 'month' ? (
        <>
          <View style={styles.weekHeader}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <Text key={day} style={[styles.weekday, { color: activeTheme.secondaryText }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeekRows.map((week, weekIndex) => (
              <View key={`${weekIndex}`} style={styles.calendarWeek}>
                {week.map((day) => {
                  const hasDayActivities = getActivitiesForDate(activities, day.dateString).length > 0;

                  return (
                    <TouchableOpacity
                      key={day.dateString}
                      activeOpacity={0.78}
                      onPress={() => selectCalendarDate(day.dateString, day.isCurrentMonth)}
                      style={styles.dayCell}
                    >
                      <View
                        style={[
                          styles.datePill,
                          day.isToday && !day.isSelected && styles.todayDatePill,
                          day.isSelected && styles.datePillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateText,
                            { color: activeTheme.mode === 'dark' ? 'rgba(251,251,248,0.62)' : 'rgba(17,17,17,0.58)' },
                            day.isWeekend && day.isCurrentMonth && styles.weekendDate,
                            !day.isCurrentMonth && {
                              color: activeTheme.mode === 'dark' ? 'rgba(155,156,158,0.38)' : 'rgba(126,127,129,0.42)',
                            },
                            day.isSelected && styles.selectedDate,
                          ]}
                        >
                          {day.dayNumber}
                        </Text>
                        {hasDayActivities && (
                          <View
                            style={[
                              styles.dateActivityDot,
                              {
                                backgroundColor: day.isSelected ? 'rgba(16,16,16,0.2)' : accent,
                                opacity: day.isSelected ? 0.22 : 0.14,
                              },
                            ]}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <ScrollView
            style={[styles.eventsPanel, { borderTopColor: activeTheme.divider }]}
            contentContainerStyle={styles.eventsPanelContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={selectedActivities.length > 3}
          >
            <Text style={styles.todayTitle}>{getAgendaTitle(selectedDate)}</Text>
            {selectedActivities.length === 0 && (
              <View
                style={[
                  styles.emptyAgendaCard,
                  {
                    backgroundColor: activeTheme.modalValueBg,
                    borderColor: activeTheme.cardBorder,
                  },
                ]}
              >
                <View style={[styles.emptyAgendaIcon, { backgroundColor: activeTheme.statIconBg }]}>
                  <Ionicons name="calendar-outline" size={18} color={accent} />
                </View>
                <View style={styles.emptyAgendaTextBlock}>
                  <Text style={[styles.emptyAgendaTitle, { color: activeTheme.titleText }]}>Open day</Text>
                  <Text style={[styles.emptyActivitiesText, { color: activeTheme.mutedText }]}>
                    No activities planned for this day
                  </Text>
                </View>
              </View>
            )}
            {selectedActivities.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                activeOpacity={0.78}
                onPress={() => onEditActivity(activity)}
                style={styles.eventRow}
              >
                <View style={[styles.eventDot, { backgroundColor: activity.color }]} />
                <Text style={[styles.eventTime, { color: activeTheme.mutedText }]} numberOfLines={1}>
                  {activity.allDay ? 'All day' : activity.startTime}
                </Text>
                <View
                  style={[
                    styles.eventDetails,
                    index < selectedActivities.length - 1 && styles.eventDivider,
                    index < selectedActivities.length - 1 && { borderBottomColor: activeTheme.divider },
                  ]}
                >
                  <Text style={[styles.eventTitle, { color: activeTheme.titleText }]} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.eventMeta, { color: activeTheme.mutedText }]} numberOfLines={2}>
                    {activity.allDay ? activity.category : `${activity.endTime} \u2022 ${activity.category}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.weekModeRow}>
            {weekDays.map((day) => {
              const hasDayActivities = getActivitiesForDate(activities, day.dateString).length > 0;

              return (
                <TouchableOpacity
                  key={day.dateString}
                  activeOpacity={0.82}
                  onPress={() => {
                    onSelectDate(day.dateString);
                    onChangeVisibleMonthDate(getMonthStartISO(day.dateString));
                  }}
                  style={[
                    styles.weekDayCard,
                    {
                      backgroundColor: day.isSelected
                        ? accent
                        : activeTheme.mode === 'dark'
                          ? 'rgba(255,255,255,0.045)'
                          : '#ffffff',
                      borderColor: day.isToday ? 'rgba(184,239,47,0.58)' : activeTheme.cardBorder,
                      shadowColor: activeTheme.shadowColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDayLabel,
                      { color: day.isSelected ? '#111111' : activeTheme.secondaryText },
                    ]}
                  >
                    {weekdayLabels[getMondayWeekdayIndex(day.dateString)]}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayNumber,
                      { color: day.isSelected ? '#111111' : activeTheme.titleText },
                      day.isWeekend && !day.isSelected && styles.weekendDate,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                  <View style={styles.weekDotRow}>
                    {hasDayActivities && (
                      <View
                        style={[
                          styles.weekActivityDot,
                          {
                            backgroundColor: day.isSelected ? '#111111' : accent,
                            opacity: day.isSelected ? 0.22 : 0.14,
                          },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <WeekTimeline
            activeTheme={activeTheme}
            activities={selectedActivities}
            selectedDate={selectedDate}
            weekZoom={weekZoom}
            onChangeWeekZoom={onChangeWeekZoom}
            onEditActivity={onEditActivity}
          />
        </>
      )}
    </View>
  );
}
