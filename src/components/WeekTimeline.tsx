import { useEffect, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday, pad2 } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';

export function WeekTimeline({
  activeTheme,
  activities,
  selectedDate,
  weekZoom,
  onChangeWeekZoom,
  onEditActivity,
}: {
  activeTheme: Theme;
  activities: Activity[];
  selectedDate: string;
  weekZoom: number;
  onChangeWeekZoom: (zoom: number | ((value: number) => number)) => void;
  onEditActivity: (activity: Activity) => void;
}) {
  const allDayActivities = activities.filter((activity) => activity.allDay);
  const zoomedHourWidth = HOUR_WIDTH * weekZoom;
  const timelineWidth = zoomedHourWidth * 24;
  const { items: timelineItems, laneCount } = buildTimelineItems(activities, selectedDate, zoomedHourWidth, timelineWidth);
  const hourMarkers = Array.from({ length: 25 }, (_, index) => index);
  const hasActivities = activities.length > 0;
  const minimumTimelineGridHeight = allDayActivities.length > 0 ? 290 : 342;
  const timelineGridHeight = Math.max(minimumTimelineGridHeight, laneCount * (CARD_HEIGHT + LANE_GAP) + 34);
  const timelineScrollRef = useRef<ScrollView | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef(weekZoom);

  const getTimelineFocusHour = () => {
    const currentHour = new Date().getHours();

    return Number.isFinite(currentHour) ? Math.max(0, currentHour - 1) : 8;
  };

  const scrollToFocusHour = (zoom = weekZoom, animated = false) => {
    const targetX = getTimelineFocusHour() * HOUR_WIDTH * zoom;

    timelineScrollRef.current?.scrollTo({ x: targetX, animated });
  };

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      scrollToFocusHour(weekZoom, false);
    }, 0);

    return () => clearTimeout(scrollTimer);
  }, [selectedDate]);

  const clampWeekZoom = (value: number) => Math.min(Math.max(value, MIN_WEEK_ZOOM), MAX_WEEK_ZOOM);

  const getTouchDistance = (event: any) => {
    const touches = event.nativeEvent.touches;

    if (!touches || touches.length < 2) {
      return null;
    }

    const [firstTouch, secondTouch] = touches;
    const deltaX = firstTouch.pageX - secondTouch.pageX;
    const deltaY = firstTouch.pageY - secondTouch.pageY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  return (
    <View
      style={[
        styles.weekTimelinePanel,
        {
          backgroundColor: activeTheme.mode === 'dark' ? 'rgba(22,24,26,0.64)' : 'rgba(255,255,255,0.78)',
          borderColor: activeTheme.cardBorder,
          shadowColor: activeTheme.shadowColor,
        },
      ]}
      onStartShouldSetResponder={(event: any) => (event.nativeEvent.touches?.length ?? 0) >= 2}
      onMoveShouldSetResponder={(event: any) => (event.nativeEvent.touches?.length ?? 0) >= 2}
      onResponderGrant={(event: any) => {
        pinchStartDistance.current = getTouchDistance(event);
        pinchStartZoom.current = weekZoom;
      }}
      onResponderMove={(event: any) => {
        const distance = getTouchDistance(event);

        if (!distance || !pinchStartDistance.current) {
          return;
        }

        onChangeWeekZoom(clampWeekZoom(pinchStartZoom.current * (distance / pinchStartDistance.current)));
      }}
      onResponderRelease={() => {
        pinchStartDistance.current = null;
      }}
      onResponderTerminate={() => {
        pinchStartDistance.current = null;
      }}
      {...({
        onWheel: (event: any) => {
          if (!event.ctrlKey && !event.metaKey) {
            return;
          }

          event.preventDefault?.();
          onChangeWeekZoom((value) => clampWeekZoom(value + (event.deltaY < 0 ? 0.08 : -0.08)));
        },
      } as any)}
    >
      {!hasActivities ? (
        <View style={styles.weekEmptyState}>
          <Text style={[styles.weekEmptyText, { color: activeTheme.mutedText }]}>No activities planned for this day</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.timelineVerticalScroll}
          contentContainerStyle={styles.timelineVerticalContent}
          showsVerticalScrollIndicator={false}
        >
          {allDayActivities.length > 0 && (
            <View style={styles.weekAllDaySection}>
              {allDayActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  activeOpacity={0.82}
                  onPress={() => onEditActivity(activity)}
                      style={[
                        styles.allDayTimelineCard,
                        {
                      backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.86)',
                      borderColor: activeTheme.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.timelineCardAccent, { backgroundColor: activity.color }]} />
                  <View style={styles.allDayTimelineText}>
                    <Text style={[styles.timelineCardTitle, { color: activeTheme.titleText }]} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    <Text style={[styles.timelineCardMeta, { color: activeTheme.mutedText }]}>All day</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ScrollView
            ref={timelineScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timelineScroll}
            contentContainerStyle={styles.timelineScrollContent}
          >
            <View style={[styles.timelineContent, { width: timelineWidth }]}>
              <View style={styles.timelineHourRow}>
                {hourMarkers.map((hour) => (
                  <View
                    key={`marker-${hour}`}
                    style={[
                      styles.timelineHourMarker,
                      { left: hour === 24 ? timelineWidth - 42 : hour * zoomedHourWidth },
                    ]}
                  >
                    <Text style={[styles.timelineHourText, { color: activeTheme.mutedText }]}>{`${pad2(hour)}:00`}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.timelineGridWrap, { width: timelineWidth, height: timelineGridHeight }]}>
                {Array.from({ length: 24 }, (_, index) => (
                  <View key={`grid-${index}`} style={[styles.timelineGuideLine, { left: index * zoomedHourWidth }]} />
                ))}

                {timelineItems.map((item) => {
                  const { activity } = item;

                  return (
                    <TouchableOpacity
                      key={activity.id}
                      activeOpacity={0.82}
                      onPress={() => onEditActivity(activity)}
                      style={[
                        styles.timelineActivityCard,
                        {
                          left: item.left,
                          top: item.top,
                          width: item.width,
                          backgroundColor:
                            activeTheme.mode === 'dark' ? 'rgba(28,30,32,0.7)' : 'rgba(255,255,255,0.84)',
                          borderColor: activeTheme.cardBorder,
                          shadowColor: activeTheme.shadowColor,
                        },
                      ]}
                    >
                      <View style={[styles.timelineCardAccent, { backgroundColor: activity.color }]} />
                      <View style={styles.timelineCardText}>
                        <Text style={[styles.timelineCardTitle, { color: activeTheme.titleText }]} numberOfLines={1}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.timelineCardMeta, { color: activeTheme.mutedText }]} numberOfLines={2}>
                          {activity.description || formatActivityTime(activity)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      )}
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          onChangeWeekZoom(1);
          setTimeout(() => scrollToFocusHour(1, true), 0);
        }}
        style={[
          styles.weekZoomResetButton,
          {
            backgroundColor: activeTheme.iconButtonBg,
            borderColor: activeTheme.iconButtonBorder,
          },
        ]}
      >
        <Ionicons name="refresh" size={17} color={activeTheme.iconButtonColor} />
      </TouchableOpacity>
    </View>
  );
}
