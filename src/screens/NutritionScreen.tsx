import { useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_DATE_WINDOW_SIZE, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';

import { MacroGlyph } from '../components/MacroGlyph';
import { NutritionRing } from '../components/NutritionRing';

export function NutritionScreen({
  activeTheme,
  selectedDate,
  meals,
  onSelectDate,
  onAddMeal,
  onEditMeal,
}: {
  activeTheme: Theme;
  selectedDate: string;
  meals: Meal[];
  onSelectDate: (date: string) => void;
  onAddMeal: () => void;
  onEditMeal: (meal: Meal) => void;
}) {
  const selectedMeals = getMealsForDate(meals, selectedDate);
  const totals = getNutritionTotals(selectedMeals);
  const [nutritionWindowStartDate, setNutritionWindowStartDate] = useState(getNutritionWindowStart(selectedDate));
  const weekDays = getNutritionWeekDays(nutritionWindowStartDate, selectedDate);
  const nutritionListRef = useRef<FlatList<(typeof weekDays)[number]> | null>(null);
  const pendingNutritionCenterDate = useRef<string | null>(null);
  const shouldCenterNutritionDateRef = useRef(true);
  const shouldAnimateNutritionCenterRef = useRef(false);
  const [nutritionDateViewportWidth, setNutritionDateViewportWidth] = useState(0);
  const [visibleNutritionMonthDate, setVisibleNutritionMonthDate] = useState(getMonthStartISO(selectedDate));
  const nutritionViewabilityConfig = useRef({ itemVisiblePercentThreshold: 45 }).current;
  const streak = getMealStreak(meals, getTodayISO());
  const caloriesLeft = nutritionGoals.calories - totals.calories;
  const proteinLeft = Math.max(0, nutritionGoals.protein - totals.protein);
  const carbsLeft = Math.max(0, nutritionGoals.carbs - totals.carbs);
  const fatLeft = Math.max(0, nutritionGoals.fat - totals.fat);
  const glassBackground = activeTheme.mode === 'dark' ? 'rgba(31,33,35,0.48)' : 'rgba(255,255,255,0.78)';
  const headerFadeColors: [string, string, string] =
    activeTheme.mode === 'dark'
      ? ['rgba(21,23,25,0.98)', 'rgba(21,23,25,0.72)', 'rgba(21,23,25,0)']
      : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.72)', 'rgba(255,255,255,0)'];
  const macroCards = [
    {
      label: 'Protein left',
      value: `${proteinLeft}g`,
      color: proteinColor,
      glyph: 'protein' as const,
      progress: totals.protein / nutritionGoals.protein,
    },
    {
      label: 'Carbs left',
      value: `${carbsLeft}g`,
      color: carbsColor,
      glyph: 'carbs' as const,
      progress: totals.carbs / nutritionGoals.carbs,
    },
    {
      label: 'Fat left',
      value: `${fatLeft}g`,
      color: fatColor,
      glyph: 'fat' as const,
      progress: totals.fat / nutritionGoals.fat,
    },
  ];

  const centerNutritionDate = (targetDate: string, animated: boolean, windowStartDate = nutritionWindowStartDate) => {
    if (nutritionDateViewportWidth <= 0) {
      return;
    }

    const selectedIndex = getDateDistance(windowStartDate, targetDate);

    if (selectedIndex < 0 || selectedIndex >= NUTRITION_DATE_WINDOW_SIZE) {
      return;
    }

    const centeredOffset = selectedIndex * NUTRITION_DATE_ITEM_WIDTH;

    nutritionListRef.current?.scrollToOffset({ offset: centeredOffset, animated });
  };

  useEffect(() => {
    if (nutritionDateViewportWidth <= 0) {
      return;
    }

    const windowEndDate = addDays(nutritionWindowStartDate, NUTRITION_DATE_WINDOW_SIZE - 1);
    const selectedDateIsOutsideWindow = selectedDate < nutritionWindowStartDate || selectedDate > windowEndDate;

    if (selectedDateIsOutsideWindow) {
      const nextWindowStart = getNutritionWindowStart(selectedDate);
      shouldCenterNutritionDateRef.current = true;
      setNutritionWindowStartDate(nextWindowStart);
      return;
    }

    const pendingCenterDate = pendingNutritionCenterDate.current;
    const targetDate = pendingCenterDate ?? selectedDate;
    pendingNutritionCenterDate.current = null;
    const shouldCenterDate = shouldCenterNutritionDateRef.current || pendingCenterDate !== null;
    const shouldAnimateCenter = shouldAnimateNutritionCenterRef.current;
    shouldCenterNutritionDateRef.current = false;
    shouldAnimateNutritionCenterRef.current = false;

    if (!shouldCenterDate) {
      return;
    }

    const scrollTimer = setTimeout(() => {
      centerNutritionDate(targetDate, shouldAnimateCenter);
      setVisibleNutritionMonthDate(getMonthStartISO(targetDate));
    }, 0);

    return () => clearTimeout(scrollTimer);
  }, [selectedDate, nutritionWindowStartDate, nutritionDateViewportWidth]);

  const viewableNutritionDates = useRef(({ viewableItems }: { viewableItems: Array<{ item?: (typeof weekDays)[number] }> }) => {
    const firstDate = viewableItems[0]?.item?.dateString;

    if (!firstDate) {
      return;
    }

    const nextMonth = getMonthStartISO(firstDate);
    setVisibleNutritionMonthDate((currentMonth) => (currentMonth === nextMonth ? currentMonth : nextMonth));
  }).current;

  const updateVisibleNutritionMonthFromScroll = (scrollX: number) => {
    if (weekDays.length === 0) {
      return;
    }

    const centerIndex = Math.min(
      weekDays.length - 1,
      Math.max(0, Math.round(scrollX / NUTRITION_DATE_ITEM_WIDTH)),
    );
    const centerDate = weekDays[centerIndex]?.dateString;

    if (!centerDate) {
      return;
    }

    const nextMonth = getMonthStartISO(centerDate);
    setVisibleNutritionMonthDate((currentMonth) => (currentMonth === nextMonth ? currentMonth : nextMonth));
  };

  const clampNutritionDateScrollOffset = (scrollX: number) => {
    const maxOffset = Math.max(0, weekDays.length * NUTRITION_DATE_ITEM_WIDTH - nutritionDateViewportWidth);
    const clampedOffset = Math.min(Math.max(scrollX, 0), maxOffset);

    if (Math.abs(clampedOffset - scrollX) > 1) {
      nutritionListRef.current?.scrollToOffset({ offset: clampedOffset, animated: true });
    }
  };

  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.5, 1]} style={styles.nutritionContent}>
      <LinearGradient
        colors={headerFadeColors}
        locations={[0, 0.68, 1]}
        pointerEvents="box-none"
        style={styles.nutritionFixedHeader}
      >
        <View style={[styles.screenHeaderRow, styles.nutritionHeader]}>
          <Text style={[styles.nutritionTitle, { color: activeTheme.titleText }]}>Nutrition</Text>
          <View style={[styles.screenHeaderActions, styles.nutritionHeaderActions]}>
            <View
              style={[
                styles.streakPill,
                {
                  backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.9)',
                  borderColor: activeTheme.cardBorder,
                  shadowColor: activeTheme.shadowColor,
                },
              ]}
            >
              <Ionicons name="flame" size={20} color={accent} />
              <Text style={[styles.streakText, { color: activeTheme.titleText }]}>{streak} day streak</Text>
            </View>
            <TouchableOpacity activeOpacity={0.82} onPress={onAddMeal} style={styles.topActionButton}>
              <Ionicons name="add" size={25} color="#111111" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.nutritionBodyScroll}
        contentContainerStyle={styles.nutritionBodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nutritionDateHeader}>
          <Text style={[styles.nutritionMonthLabel, { color: activeTheme.mutedText }]}>
            {getMonthTitle(visibleNutritionMonthDate)}
          </Text>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => {
              const today = getTodayISO();
              const todayWindowStart = getNutritionWindowStart(today);
              const shouldCenterImmediately = today === selectedDate && todayWindowStart === nutritionWindowStartDate;
              shouldCenterNutritionDateRef.current = true;
              shouldAnimateNutritionCenterRef.current = true;
              setNutritionWindowStartDate(todayWindowStart);
              onSelectDate(today);
              setVisibleNutritionMonthDate(getMonthStartISO(today));
              if (shouldCenterImmediately) {
                requestAnimationFrame(() => {
                  centerNutritionDate(today, true, todayWindowStart);
                  shouldCenterNutritionDateRef.current = false;
                  shouldAnimateNutritionCenterRef.current = false;
                });
              }
            }}
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
        </View>

        <View
          style={styles.nutritionDateScrollerFrame}
          onLayout={(event) => setNutritionDateViewportWidth(event.nativeEvent.layout.width)}
        >
          <FlatList
            ref={nutritionListRef}
            horizontal
            data={weekDays}
            keyExtractor={(day) => day.dateString}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            alwaysBounceHorizontal={false}
            overScrollMode="never"
            style={styles.nutritionWeekScroll}
            contentContainerStyle={styles.nutritionWeekRow}
            initialNumToRender={21}
            windowSize={5}
            maxToRenderPerBatch={21}
            removeClippedSubviews={false}
            getItemLayout={(_, index) => ({
              length: NUTRITION_DATE_ITEM_WIDTH,
              offset: NUTRITION_DATE_ITEM_WIDTH * index,
              index,
            })}
            onScroll={(event) => {
              updateVisibleNutritionMonthFromScroll(event.nativeEvent.contentOffset.x);
            }}
            onMomentumScrollEnd={(event) => {
              clampNutritionDateScrollOffset(event.nativeEvent.contentOffset.x);
            }}
            onScrollEndDrag={(event) => {
              clampNutritionDateScrollOffset(event.nativeEvent.contentOffset.x);
            }}
            scrollEventThrottle={64}
            onViewableItemsChanged={viewableNutritionDates}
            viewabilityConfig={nutritionViewabilityConfig}
            renderItem={({ item: day }) => {
              const hasMeals = hasMealsForDate(meals, day.dateString);

              return (
                <TouchableOpacity
                  key={day.dateString}
                  activeOpacity={0.82}
                  onPress={() => onSelectDate(day.dateString)}
                  style={[
                    styles.nutritionDateCard,
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
                  <Text style={[styles.weekDayLabel, { color: day.isSelected ? '#111111' : activeTheme.secondaryText }]}>
                    {day.dayLabel.slice(0, 1) + day.dayLabel.slice(1).toLowerCase()}
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
                    {hasMeals && (
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
            }}
          />
        </View>

        <View
          style={[
            styles.caloriesCard,
            {
              backgroundColor: glassBackground,
              borderColor: activeTheme.cardBorder,
              shadowColor: activeTheme.mode === 'dark' ? accent : activeTheme.shadowColor,
            },
          ]}
        >
          <View>
            <Text style={[styles.caloriesLeftNumber, { color: activeTheme.titleText }]}>{formatCalories(caloriesLeft)}</Text>
            <Text style={[styles.caloriesLeftLabel, { color: activeTheme.secondaryText }]}>Calories left</Text>
          </View>
          <NutritionRing color={accent} progress={totals.calories / nutritionGoals.calories} size={118} icon="flame" activeTheme={activeTheme} />
        </View>

        <View style={styles.macroGrid}>
          {macroCards.map((macro) => (
            <View
              key={macro.label}
              style={[
                styles.macroCard,
                {
                  backgroundColor: glassBackground,
                  borderColor: activeTheme.cardBorder,
                  shadowColor: activeTheme.shadowColor,
                },
              ]}
            >
              <Text style={[styles.macroValue, { color: activeTheme.titleText }]}>{macro.value}</Text>
              <Text style={[styles.macroLabel, { color: activeTheme.secondaryText }]}>{macro.label}</Text>
              <NutritionRing color={macro.color} progress={macro.progress} size={76} glyph={macro.glyph} activeTheme={activeTheme} />
            </View>
          ))}
        </View>

        <View style={styles.nutritionCarouselDots}>
          <View style={[styles.nutritionCarouselDot, { backgroundColor: accent }]} />
          <View style={[styles.nutritionCarouselDot, { backgroundColor: activeTheme.statTrack }]} />
          <View style={[styles.nutritionCarouselDot, { backgroundColor: activeTheme.statTrack }]} />
        </View>

        <Text style={[styles.recentTitle, { color: activeTheme.titleText }]}>{getNutritionDateHeading(selectedDate)}</Text>
        {selectedMeals.length > 0 ? (
          selectedMeals.map((meal, index) => (
            <TouchableOpacity
              key={meal.id}
              activeOpacity={0.84}
              onPress={() => onEditMeal(meal)}
              style={[
                styles.mealCard,
                index > 0 && styles.mealCardStack,
                {
                  backgroundColor: glassBackground,
                  borderColor: activeTheme.cardBorder,
                  shadowColor: activeTheme.shadowColor,
                },
              ]}
            >
              <View style={styles.mealCardBody}>
                <View style={styles.mealCardHeader}>
                  <Text style={[styles.mealName, { color: activeTheme.titleText }]} numberOfLines={1}>
                    {meal.name}
                  </Text>
                  <View style={[styles.mealTimePill, { backgroundColor: activeTheme.modalControlBg }]}>
                    <Text style={[styles.mealTimeText, { color: activeTheme.secondaryText }]}>{formatMealTime(meal.time)}</Text>
                  </View>
                </View>
                <View style={styles.mealCaloriesRow}>
                  <Ionicons name="flame" size={19} color={accent} />
                  <Text style={[styles.mealCaloriesText, { color: activeTheme.titleText }]}>
                    {formatCalories(meal.calories)} calories
                  </Text>
                </View>
                <View style={styles.mealMacrosRow}>
                  <MacroGlyph type="protein" color={proteinColor} size={15} />
                  <Text style={[styles.mealMacroText, { color: activeTheme.secondaryText }]}>{meal.protein}g</Text>
                  <View style={[styles.mealMacroDivider, { backgroundColor: activeTheme.divider }]} />
                  <MacroGlyph type="carbs" color={carbsColor} size={15} />
                  <Text style={[styles.mealMacroText, { color: activeTheme.secondaryText }]}>{meal.carbs}g</Text>
                  <View style={[styles.mealMacroDivider, { backgroundColor: activeTheme.divider }]} />
                  <MacroGlyph type="fat" color={fatColor} size={15} />
                  <Text style={[styles.mealMacroText, { color: activeTheme.secondaryText }]}>{meal.fat}g</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={[
              styles.nutritionEmptyCard,
              {
                backgroundColor: glassBackground,
                borderColor: activeTheme.cardBorder,
              },
            ]}
          >
            <Ionicons name="restaurant-outline" size={22} color={accent} />
            <Text style={[styles.nutritionEmptyText, { color: activeTheme.mutedText }]}>No meals logged for this day</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
