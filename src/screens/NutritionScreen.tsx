import { useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor, statusBad, statusGood, statusWarning } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_DATE_WINDOW_SIZE, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getGoalCompletionPercent, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';
import { getGoalCompletionRatio, getTargetStatusColor } from '../utils/healthTargets';

import { MacroGlyph } from '../components/MacroGlyph';
import { NutritionRing } from '../components/NutritionRing';

export function NutritionScreen({
  activeTheme,
  selectedDate,
  meals,
  nutritionTargets,
  onSelectDate,
  onAddMeal,
  onEditMeal,
}: {
  activeTheme: Theme;
  selectedDate: string;
  meals: Meal[];
  nutritionTargets?: NutritionTotals;
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
  const [nutritionCarouselWidth, setNutritionCarouselWidth] = useState(0);
  const [activeNutritionCarouselPage, setActiveNutritionCarouselPage] = useState(0);
  const [visibleNutritionMonthDate, setVisibleNutritionMonthDate] = useState(getMonthStartISO(selectedDate));
  const nutritionViewabilityConfig = useRef({ itemVisiblePercentThreshold: 45 }).current;
  const streak = getMealStreak(meals, getTodayISO());
  const targets = nutritionTargets ?? nutritionGoals;
  const caloriesLeft = targets.calories - totals.calories;
  const proteinLeft = Math.max(0, targets.protein - totals.protein);
  const carbsLeft = Math.max(0, targets.carbs - totals.carbs);
  const fatLeft = Math.max(0, targets.fat - totals.fat);
  const caloriesPercent = getGoalCompletionPercent(totals.calories, targets.calories);
  const caloriesProgress = getGoalCompletionRatio(totals.calories, targets.calories);
  const caloriesStatusColor = getTargetStatusColor(totals.calories, targets.calories);
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
      statusColor: getTargetStatusColor(totals.protein, targets.protein),
      percentage: getGoalCompletionPercent(totals.protein, targets.protein),
      glyph: 'protein' as const,
      progress: getGoalCompletionRatio(totals.protein, targets.protein),
    },
    {
      label: 'Carbs left',
      value: `${carbsLeft}g`,
      color: carbsColor,
      statusColor: getTargetStatusColor(totals.carbs, targets.carbs),
      percentage: getGoalCompletionPercent(totals.carbs, targets.carbs),
      glyph: 'carbs' as const,
      progress: getGoalCompletionRatio(totals.carbs, targets.carbs),
    },
    {
      label: 'Fat left',
      value: `${fatLeft}g`,
      color: fatColor,
      statusColor: getTargetStatusColor(totals.fat, targets.fat),
      percentage: getGoalCompletionPercent(totals.fat, targets.fat),
      glyph: 'fat' as const,
      progress: getGoalCompletionRatio(totals.fat, targets.fat),
    },
  ];
  const nutritionCarouselPages = [0, 1, 2];
  const proteinCalories = Math.max(0, totals.protein * 4);
  const carbsCalories = Math.max(0, totals.carbs * 4);
  const fatCalories = Math.max(0, totals.fat * 9);
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;
  const macroContributions = [proteinCalories, carbsCalories, fatCalories];
  const largestMacroIndex = macroContributions.reduce(
    (largestIndex, value, index) => (value > macroContributions[largestIndex] ? index : largestIndex),
    0,
  );
  const roundedMacroPercentages =
    totalMacroCalories <= 0
      ? [0, 0, 0]
      : macroContributions.map((value) => Math.round((value / totalMacroCalories) * 100));
  if (totalMacroCalories > 0) {
    const roundingRemainder = 100 - roundedMacroPercentages.reduce((sum, value) => sum + value, 0);
    roundedMacroPercentages[largestMacroIndex] += roundingRemainder;
  }
  const macroComposition = [
    { label: 'Protein', percent: roundedMacroPercentages[0], color: proteinColor },
    { label: 'Carbs', percent: roundedMacroPercentages[1], color: carbsColor },
    { label: 'Fat', percent: roundedMacroPercentages[2], color: fatColor },
  ];
  const compositionRingSize = 126;
  const compositionRingStrokeWidth = 15;
  const compositionRingCenter = compositionRingSize / 2;
  const compositionRingRadius = (compositionRingSize - compositionRingStrokeWidth) / 2;
  const compositionRingCircumference = 2 * Math.PI * compositionRingRadius;
  let compositionSegmentOffset = 0;
  const compositionRingSegments = macroComposition.map((macro) => {
    const segmentLength = compositionRingCircumference * (macro.percent / 100);
    const segment = {
      ...macro,
      dashArray: `${segmentLength} ${compositionRingCircumference - segmentLength}`,
      dashOffset: -compositionSegmentOffset,
    };
    compositionSegmentOffset += segmentLength;
    return segment;
  });
  const targetProteinCalories = Math.max(0, targets.protein * 4);
  const targetCarbsCalories = Math.max(0, targets.carbs * 4);
  const targetFatCalories = Math.max(0, targets.fat * 9);
  const targetMacroCalories = targetProteinCalories + targetCarbsCalories + targetFatCalories;
  const actualMacroRatios = totalMacroCalories <= 0 ? [0, 0, 0] : macroContributions.map((value) => value / totalMacroCalories);
  const targetMacroRatios =
    targetMacroCalories <= 0
      ? [0, 0, 0]
      : [targetProteinCalories / targetMacroCalories, targetCarbsCalories / targetMacroCalories, targetFatCalories / targetMacroCalories];
  const averageMacroDeviation =
    totalMacroCalories <= 0 || targetMacroCalories <= 0
      ? 1
      : actualMacroRatios.reduce((sum, ratio, index) => sum + Math.abs(ratio - targetMacroRatios[index]), 0) / 3;
  const safeCalorieTarget = Number.isFinite(targets.calories) && targets.calories > 0 ? targets.calories : 0;
  const calorieRatio = safeCalorieTarget > 0 ? totals.calories / safeCalorieTarget : 0;
  const ratingScore = Math.max(0, Math.min(100, 100 - Math.abs(calorieRatio - 1) * 70 - averageMacroDeviation * 120));
  const balanceRating =
    ratingScore >= 90
      ? 'Amazing'
      : ratingScore >= 78
        ? 'Very good'
        : ratingScore >= 64
          ? 'Good'
          : ratingScore >= 48
            ? 'Okay'
            : ratingScore >= 32
              ? 'Bad'
              : 'Really bad';
  const balanceRatingColor =
    ratingScore >= 64 ? statusGood : ratingScore >= 32 ? statusWarning : statusBad;

  const handleNutritionCarouselLayout = (event: LayoutChangeEvent) => {
    setNutritionCarouselWidth(event.nativeEvent.layout.width);
  };

  const handleNutritionCarouselMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (nutritionCarouselWidth <= 0) {
      return;
    }

    const nextPage = Math.round(event.nativeEvent.contentOffset.x / nutritionCarouselWidth);
    setActiveNutritionCarouselPage(Math.min(Math.max(nextPage, 0), nutritionCarouselPages.length - 1));
  };

  const centerNutritionDate = (targetDate: string, animated: boolean, windowStartDate = nutritionWindowStartDate) => {
    if (nutritionDateViewportWidth <= 0) {
      return;
    }

    const selectedIndex = getDateDistance(windowStartDate, targetDate);

    if (selectedIndex < 0 || selectedIndex >= weekDays.length) {
      return;
    }

    const rawCenteredOffset =
      selectedIndex * NUTRITION_DATE_ITEM_WIDTH - (nutritionDateViewportWidth - NUTRITION_DATE_ITEM_WIDTH) / 2;
    const maxOffset = Math.max(0, weekDays.length * NUTRITION_DATE_ITEM_WIDTH - nutritionDateViewportWidth);
    const centeredOffset = Math.min(Math.max(rawCenteredOffset, 0), maxOffset);

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

        <View style={styles.nutritionCarouselShell} onLayout={handleNutritionCarouselLayout}>
          <ScrollView
            horizontal
            pagingEnabled
            bounces={false}
            alwaysBounceHorizontal={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleNutritionCarouselMomentumEnd}
            style={styles.nutritionCarouselScroller}
            contentContainerStyle={styles.nutritionCarouselContent}
          >
            <View style={[styles.nutritionCarouselPage, { width: nutritionCarouselWidth }]}>
              <View style={styles.nutritionCarouselPageInner}>
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
                <View style={[styles.caloriesStatusPill, { backgroundColor: caloriesStatusColor }]} />
                <View>
                  <Text style={[styles.caloriesLeftNumber, { color: activeTheme.titleText }]}>{formatCalories(caloriesLeft)}</Text>
                  <Text style={[styles.caloriesLeftLabel, { color: activeTheme.secondaryText }]}>Calories left</Text>
                  <View
                    style={[
                      styles.calorieMetaBox,
                      {
                        backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(17,17,17,0.026)',
                        borderColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(17,17,17,0.038)',
                      },
                    ]}
                  >
                    <View style={styles.calorieMetaItem}>
                      <Ionicons name="locate-outline" size={9} color={hexToRgba(accent, 0.48)} />
                      <Text style={[styles.calorieMetaText, { color: activeTheme.secondaryText }]}>
                        Goal <Text style={[styles.calorieMetaStrong, { color: activeTheme.secondaryText }]}>{formatCalories(targets.calories)} cal</Text>
                      </Text>
                    </View>
                    <View style={[styles.calorieMetaDivider, { backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(17,17,17,0.07)' }]} />
                    <View style={styles.calorieMetaItem}>
                      <Ionicons name="flame-outline" size={9} color={hexToRgba(accent, 0.48)} />
                      <Text style={[styles.calorieMetaText, { color: activeTheme.secondaryText }]}>
                        <Text style={[styles.calorieMetaStrong, { color: activeTheme.secondaryText }]}>{formatCalories(totals.calories)}</Text> eaten
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.caloriesRingWrap}>
                  <NutritionRing color={accent} progress={caloriesProgress} size={108} icon="flame" activeTheme={activeTheme} />
                  <View style={[styles.goalPercentChip, styles.caloriesPercentChip, { backgroundColor: activeTheme.modalControlBg }]}>
                    <Text style={[styles.goalPercentChipText, { color: accent }]}>{caloriesPercent}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.macroGrid}>
                {macroCards.map((macro, index) => (
                  <View
                    key={macro.label}
                    style={[
                      styles.macroCard,
                      index < macroCards.length - 1 && styles.macroCardSpacing,
                      {
                        backgroundColor: glassBackground,
                        borderColor: activeTheme.cardBorder,
                        shadowColor: activeTheme.shadowColor,
                      },
                    ]}
                  >
                    <View style={styles.macroValueRow}>
                      <Text numberOfLines={1} style={[styles.macroValue, { color: activeTheme.titleText }]}>{macro.value}</Text>
                      <View style={[styles.macroStatusPill, { backgroundColor: macro.statusColor }]} />
                    </View>
                    <Text numberOfLines={1} style={[styles.macroLabel, { color: activeTheme.secondaryText }]}>{macro.label}</Text>
                    <View style={styles.macroRingSlot}>
                      <NutritionRing color={macro.color} progress={macro.progress} size={72} glyph={macro.glyph} activeTheme={activeTheme} />
                    </View>
                    <View style={[styles.goalPercentChip, styles.macroPercentChip, { backgroundColor: activeTheme.modalControlBg }]}>
                      <Text style={[styles.goalPercentChipText, { color: macro.color }]}>{macro.percentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
              </View>
            </View>

            <View style={[styles.nutritionCarouselPage, { width: nutritionCarouselWidth }]}>
              <View style={styles.nutritionCarouselPageInner}>
              <View
                style={[
                  styles.nutritionInsightCard,
                  {
                    backgroundColor: glassBackground,
                    borderColor: activeTheme.cardBorder,
                    shadowColor: activeTheme.shadowColor,
                  },
                ]}
              >
                <View style={styles.nutritionInsightTopRow}>
                  <View style={[styles.nutritionInsightIcon, { backgroundColor: hexToRgba(accent, activeTheme.mode === 'dark' ? 0.12 : 0.1) }]}>
                    <Ionicons name="restaurant-outline" size={21} color={accent} />
                  </View>
                  <View style={styles.nutritionRatingChipSpacer} />
                </View>
                <Text style={[styles.nutritionInsightTitle, { color: activeTheme.titleText }]}>Food Balance</Text>
                <Text style={[styles.nutritionInsightSubtitle, { color: activeTheme.secondaryText }]}>Aligned with your current target</Text>
                <View style={styles.foodBalanceBody}>
                  <View style={styles.compositionRingWrap}>
                    <View style={styles.compositionRingTrack}>
                      <Svg width={compositionRingSize} height={compositionRingSize} style={{ position: 'absolute' }}>
                        <Circle
                          cx={compositionRingCenter}
                          cy={compositionRingCenter}
                          r={compositionRingRadius}
                          stroke={activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.075)' : 'rgba(17,17,17,0.06)'}
                          fill="none"
                          strokeWidth={compositionRingStrokeWidth}
                        />
                        {totalMacroCalories > 0
                          ? compositionRingSegments.map((segment) => (
                              segment.percent > 0 ? (
                                <Circle
                                  key={segment.label}
                                  cx={compositionRingCenter}
                                  cy={compositionRingCenter}
                                  r={compositionRingRadius}
                                  stroke={segment.color}
                                  fill="none"
                                  strokeWidth={compositionRingStrokeWidth}
                                  strokeDasharray={segment.dashArray}
                                  strokeDashoffset={segment.dashOffset}
                                  strokeLinecap="butt"
                                  rotation="-90"
                                  originX={compositionRingCenter}
                                  originY={compositionRingCenter}
                                />
                              ) : null
                            ))
                          : null}
                      </Svg>
                      <View
                        style={[
                          styles.compositionRingCenter,
                          {
                            backgroundColor: activeTheme.mode === 'dark' ? 'rgba(31,33,35,0.92)' : 'rgba(255,255,255,0.94)',
                            borderColor: activeTheme.cardBorder,
                          },
                        ]}
                      >
                        <Ionicons name="restaurant-outline" size={23} color={accent} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.macroCompositionList}>
                    {macroComposition.map((macro, index) => (
                      <View key={macro.label} style={[styles.macroCompositionRow, index < macroComposition.length - 1 && styles.macroCompositionRowSpacing]}>
                        <View style={[styles.macroCompositionDot, { backgroundColor: macro.color }]} />
                        <Text style={[styles.macroCompositionLabel, { color: activeTheme.secondaryText }]}>{macro.label}</Text>
                        <Text style={[styles.macroCompositionPercent, { color: macro.color }]}>{macro.percent}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              </View>
            </View>

            <View style={[styles.nutritionCarouselPage, { width: nutritionCarouselWidth }]}>
              <View style={styles.nutritionCarouselPageInner}>
              <View
                style={[
                  styles.aiSummaryCard,
                  {
                    backgroundColor: glassBackground,
                    borderColor: activeTheme.cardBorder,
                    shadowColor: activeTheme.shadowColor,
                  },
                ]}
              >
                <View style={styles.aiSummaryHeader}>
                  <View style={[styles.aiSummaryLogoRing, { borderColor: hexToRgba(accent, 0.3), backgroundColor: activeTheme.mode === 'dark' ? 'rgba(184,239,47,0.07)' : 'rgba(184,239,47,0.1)' }]}>
                    <View style={[styles.aiSummaryLogoCore, { backgroundColor: activeTheme.mode === 'dark' ? 'rgba(31,33,35,0.94)' : 'rgba(255,255,255,0.95)' }]}>
                      <Ionicons name="sparkles-outline" size={21} color={accent} />
                    </View>
                  </View>
                  <View style={styles.aiSummaryTitleBlock}>
                    <Text style={[styles.nutritionInsightTitle, { color: activeTheme.titleText }]}>AI Summary</Text>
                    <Text style={[styles.nutritionInsightSubtitle, { color: activeTheme.secondaryText }]}>Daily insight placeholder</Text>
                  </View>
                  <View
                    style={[
                      styles.nutritionRatingChip,
                      {
                        backgroundColor: hexToRgba(balanceRatingColor, 0.12),
                        borderColor: hexToRgba(balanceRatingColor, 0.25),
                        shadowColor: balanceRatingColor,
                      },
                    ]}
                  >
                    <Text style={[styles.nutritionRatingChipText, { color: balanceRatingColor }]}>{balanceRating}</Text>
                  </View>
                </View>
                <Text style={[styles.nutritionAiPlaceholder, { color: activeTheme.secondaryText }]}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae nibh at arcu dapibus tempo. Sed nutrition trend stays ready for deeper insight.
                </Text>
                <View style={[styles.nutritionSummaryDivider, { backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.075)' : 'rgba(17,17,17,0.07)' }]} />
                <View style={styles.nutritionTagRow}>
                  {['Goal-aligned', 'Macro balance', 'Daily trend'].map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.nutritionTag,
                        {
                          backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(17,17,17,0.045)',
                          borderColor: activeTheme.cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.nutritionTagText, { color: activeTheme.secondaryText }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={styles.nutritionCarouselDots}>
          {nutritionCarouselPages.map((page) => (
            <View
              key={page}
              style={[
                styles.nutritionCarouselDot,
                {
                  backgroundColor: activeNutritionCarouselPage === page ? accent : activeTheme.statTrack,
                  opacity: activeNutritionCarouselPage === page ? 1 : 0.72,
                },
              ]}
            />
          ))}
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
