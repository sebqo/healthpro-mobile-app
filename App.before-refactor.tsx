import { useEffect, useRef, useState, type ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Modal,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TabKey = 'Home' | 'Activity' | 'Nutrition' | 'Profile';
type EditableStatKey = 'Sleep' | 'Hydration' | 'Calories';
type SleepStep = 15 | 60;
type CalorieStep = 10 | 100;
type ActivityViewMode = 'month' | 'week';
type IconName = ComponentProps<typeof Ionicons>['name'];
type RepeatOption = 'none' | 'daily' | 'weekly' | 'custom';

type Stat = {
  label: 'Sleep' | 'Prod. Left' | 'Hydration' | 'Calories';
  value: string;
  icon: IconName;
  progress: number;
  editable?: boolean;
  accentColor?: string;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate?: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  category: 'Productivity' | 'Health';
  color: string;
  allDay: boolean;
  repeat: RepeatOption;
  customWeekdays?: number[];
};

type ActivityDraft = Activity;
type ActivityModalMode = 'new' | 'edit';
type MealModalMode = 'new' | 'edit';
type EditingTimeTarget = 'start' | 'end' | null;
type EditingDateTarget = 'start' | 'end' | null;
type MealSource = 'manual' | 'scan';

type Meal = {
  id: string;
  name: string;
  date: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: MealSource;
  category?: string;
};

type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type TimelineItem = {
  activity: Activity;
  visualStart: number;
  visualEnd: number;
  left: number;
  width: number;
  top: number;
  lane: number;
};

type CalendarDay = {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  isSelected: boolean;
};

type Theme = {
  mode: 'dark' | 'light';
  safeAreaBg: string;
  phoneBg: string;
  homeGradient: [string, string, string];
  statsGradient: [string, string];
  text: string;
  titleText: string;
  mutedText: string;
  secondaryText: string;
  calendarBg: string;
  cardBg: string;
  cardBorder: string;
  iconButtonBg: string;
  iconButtonBorder: string;
  iconButtonColor: string;
  statIconBg: string;
  statTrack: string;
  divider: string;
  tabBg: string;
  tabText: string;
  tabMuted: string;
  homeIndicator: string;
  modalOverlay: string;
  modalBg: string;
  modalControlBg: string;
  modalValueBg: string;
  shadowColor: string;
};

const accent = '#b8ef2f';
const HOUR_WIDTH = 120;
const TIMELINE_WIDTH = HOUR_WIDTH * 24;
const CARD_HEIGHT = 68;
const LANE_GAP = 14;
const MIN_ACTIVITY_WIDTH = 130;
const TIMELINE_VIEWPORT_HEIGHT = 540;
const MIN_WEEK_ZOOM = 0.65;
const MAX_WEEK_ZOOM = 1.6;
const NUTRITION_DATE_CARD_WIDTH = 62;
const NUTRITION_DATE_CARD_GAP = 7;
const NUTRITION_DATE_ITEM_WIDTH = NUTRITION_DATE_CARD_WIDTH + NUTRITION_DATE_CARD_GAP;
const NUTRITION_DATE_WINDOW_SIZE = 61;
const NUTRITION_FIXED_HEADER_HEIGHT = 124;

const activityColorPalette = [
  '#ec6f9d',
  '#a855f7',
  '#6d5dfc',
  '#38bdf8',
  '#22d3ee',
  '#2dd4bf',
  '#10b981',
  '#65c832',
  '#d9e64c',
  '#facc15',
  '#c65f54',
  '#6f2d3a',
];

const darkTheme: Theme = {
  mode: 'dark',
  safeAreaBg: '#0b0d0e',
  phoneBg: '#0b0d0e',
  homeGradient: ['#151719', '#0b0d0e', '#151719'],
  statsGradient: ['rgba(43, 45, 47, 0.9)', 'rgba(31, 33, 35, 0.86)'],
  text: '#f7f7f5',
  titleText: '#fbfbf8',
  mutedText: '#9b9c9e',
  secondaryText: '#a5a6a8',
  calendarBg: '#111315',
  cardBg: 'rgba(31, 33, 35, 0.96)',
  cardBorder: 'rgba(255,255,255,0.08)',
  iconButtonBg: 'rgba(255,255,255,0.12)',
  iconButtonBorder: 'rgba(255,255,255,0.08)',
  iconButtonColor: '#ffffff',
  statIconBg: 'rgba(184,239,47,0.14)',
  statTrack: 'rgba(255,255,255,0.13)',
  divider: 'rgba(255,255,255,0.08)',
  tabBg: 'rgba(33,35,37,0.98)',
  tabText: '#eeeeec',
  tabMuted: '#eeeeec',
  homeIndicator: '#ffffff',
  modalOverlay: 'rgba(0,0,0,0.48)',
  modalBg: 'rgba(32,35,38,0.97)',
  modalControlBg: '#313538',
  modalValueBg: '#292d30',
  shadowColor: '#000000',
};

const lightTheme: Theme = {
  mode: 'light',
  safeAreaBg: '#ffffff',
  phoneBg: '#ffffff',
  homeGradient: ['#ffffff', '#f7f8f4', '#ffffff'],
  statsGradient: ['rgba(255,255,255,0.9)', 'rgba(244,246,240,0.84)'],
  text: '#141414',
  titleText: '#111111',
  mutedText: '#7e7f81',
  secondaryText: '#7a7c7e',
  calendarBg: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: '#e9ece5',
  iconButtonBg: '#f2f4ef',
  iconButtonBorder: '#e8ebe3',
  iconButtonColor: '#111111',
  statIconBg: 'rgba(184,239,47,0.22)',
  statTrack: 'rgba(17,17,17,0.11)',
  divider: '#eeeeee',
  tabBg: '#ffffff',
  tabText: '#111111',
  tabMuted: '#1b1b1b',
  homeIndicator: '#000000',
  modalOverlay: 'rgba(0,0,0,0.26)',
  modalBg: 'rgba(255,255,255,0.97)',
  modalControlBg: '#f1f3ee',
  modalValueBg: '#ffffff',
  shadowColor: '#000000',
};

const tabs: Array<{ key: TabKey; icon: IconName; activeIcon: IconName }> = [
  { key: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Activity', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { key: 'Nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { key: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

const formatCalories = (value: number) => value.toLocaleString('en-US');

const formatHydration = (ml: number) => `${(ml / 1000).toFixed(1)} L`;

const nutritionGoals: NutritionTotals = {
  calories: 3000,
  protein: 160,
  carbs: 300,
  fat: 70,
};

const proteinColor = '#ff5268';
const carbsColor = '#ff8a1f';
const fatColor = '#f4c430';

const formatSleep = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const toLocalISODate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const getTodayISO = () => toLocalISODate(new Date());

const isToday = (dateString: string) => dateString === getTodayISO();

const addDays = (dateString: string, days: number) => {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);

  return toLocalISODate(date);
};

const addMonths = (dateString: string, months: number) => {
  const date = parseLocalDate(dateString);
  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  return toLocalISODate(date);
};

const getMonthTitle = (dateString: string) => {
  const date = parseLocalDate(dateString);
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const getAgendaTitle = (dateString: string) => {
  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const date = parseLocalDate(dateString);
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dateLabel = `${weekdayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;

  if (dateString === today) {
    return `Today \u2022 ${dateLabel}`;
  }

  if (dateString === tomorrow) {
    return `Tomorrow \u2022 ${dateLabel}`;
  }

  return dateLabel;
};

const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const safeParseMinutes = (time: string, fallback: number) => {
  const [hoursText, minutesText] = time.split(':');
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return fallback;
  }

  return Math.min(Math.max(hours, 0), 23) * 60 + Math.min(Math.max(minutes, 0), 59);
};

const clampMinutes = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};

const getActivityRangeForDate = (activity: Activity, selectedDate: string) => {
  const startDate = activity.startDate ?? activity.date;
  const endDate = activity.endDate ?? startDate;
  const fallbackStart = 9 * 60;
  const startMinutes = safeParseMinutes(activity.startTime, fallbackStart);
  const endMinutes = safeParseMinutes(activity.endTime, startMinutes + 60);
  const isOriginalDateSpan = startDate <= selectedDate && selectedDate <= endDate && startDate !== endDate;
  let visualStart = isOriginalDateSpan && selectedDate > startDate ? 0 : startMinutes;
  let visualEnd = isOriginalDateSpan && selectedDate < endDate ? 1440 : endMinutes;

  visualStart = clampMinutes(visualStart, 0, 1440);
  visualEnd = clampMinutes(visualEnd, 0, 1440);

  if (visualEnd - visualStart < 30) {
    visualEnd = clampMinutes(visualStart + 30, 0, 1440);
  }

  if (visualEnd <= visualStart) {
    visualStart = Math.max(0, visualEnd - 30);
  }

  return { visualStart, visualEnd };
};

const buildTimelineItems = (
  activities: Activity[],
  selectedDate: string,
  hourWidth = HOUR_WIDTH,
  timelineWidth = TIMELINE_WIDTH,
) => {
  const laneEnds: number[] = [];
  const sortedActivities = [...activities]
    .filter((activity) => !activity.allDay)
    .map((activity) => ({
      activity,
      ...getActivityRangeForDate(activity, selectedDate),
    }))
    .sort((a, b) => a.visualStart - b.visualStart || a.visualEnd - b.visualEnd);

  const items = sortedActivities.map<TimelineItem>(({ activity, visualStart, visualEnd }) => {
    const duration = Math.max(30, visualEnd - visualStart);
    const lane = laneEnds.findIndex((laneEnd) => visualStart >= laneEnd);
    const normalizedLane = lane === -1 ? laneEnds.length : lane;
    const computedLeft = (visualStart / 60) * hourWidth;
    const left = Math.min(computedLeft, timelineWidth - MIN_ACTIVITY_WIDTH);
    const width = Math.min(Math.max(MIN_ACTIVITY_WIDTH, (duration / 60) * hourWidth), timelineWidth - left);

    laneEnds[normalizedLane] = visualEnd;

    return {
      activity,
      visualStart,
      visualEnd,
      left,
      width,
      top: normalizedLane * (CARD_HEIGHT + LANE_GAP),
      lane: normalizedLane,
    };
  });

  return { items, laneCount: Math.max(laneEnds.length, 1) };
};

const getMondayWeekdayIndex = (dateString: string) => {
  const date = parseLocalDate(dateString);

  return (date.getDay() + 6) % 7;
};

const compareActivityDateTime = (a: Activity, b: Activity) => {
  const dateCompare = a.date.localeCompare(b.date);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  if (a.allDay !== b.allDay) {
    return a.allDay ? -1 : 1;
  }

  return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
};

const getDateDistance = (startDate: string, endDate: string) => {
  const start = parseLocalDate(startDate).getTime();
  const end = parseLocalDate(endDate).getTime();

  return Math.round((end - start) / 86400000);
};

const getMonthStartISO = (dateString: string) => {
  const date = parseLocalDate(dateString);

  return toLocalISODate(new Date(date.getFullYear(), date.getMonth(), 1));
};

const getWeekStartISO = (dateString: string) => {
  const date = parseLocalDate(dateString);
  const mondayIndex = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayIndex);

  return toLocalISODate(date);
};

const getWeekDays = (dateString: string): CalendarDay[] => {
  const weekStart = getWeekStartISO(dateString);

  return Array.from({ length: 7 }, (_, index) => {
    const date = parseLocalDate(addDays(weekStart, index));
    const dateStringForDay = toLocalISODate(date);

    return {
      dateString: dateStringForDay,
      dayNumber: date.getDate(),
      isCurrentMonth: true,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: isToday(dateStringForDay),
      isSelected: dateStringForDay === dateString,
    };
  });
};

const activityOccursOnDate = (activity: Activity, dateString: string) => {
  const activityStartDate = activity.startDate ?? activity.date;
  const activityEndDate = activity.endDate ?? activityStartDate;
  const spanDays = Math.max(getDateDistance(activityStartDate, activityEndDate), 0);

  if (dateString < activityStartDate) {
    return false;
  }

  if (activity.repeat === 'none') {
    return activityStartDate <= dateString && dateString <= activityEndDate;
  }

  if (activity.repeat === 'daily') {
    return true;
  }

  if (activity.repeat === 'weekly') {
    const daysSinceStart = getDateDistance(activityStartDate, dateString);

    return daysSinceStart >= 0 && daysSinceStart % 7 <= spanDays;
  }

  if (activity.repeat === 'custom') {
    const selectedWeekdays =
      activity.customWeekdays && activity.customWeekdays.length > 0
        ? activity.customWeekdays
        : [getMondayWeekdayIndex(activityStartDate)];

    return Array.from({ length: spanDays + 1 }, (_, offset) => addDays(dateString, -offset)).some(
      (occurrenceStartDate) =>
        occurrenceStartDate >= activityStartDate &&
        selectedWeekdays.includes(getMondayWeekdayIndex(occurrenceStartDate)),
    );
  }

  return activityStartDate <= dateString && dateString <= activityEndDate;
};

const getActivitiesForDate = (activities: Activity[], dateString: string) =>
  activities.filter((activity) => activityOccursOnDate(activity, dateString)).sort(compareActivityDateTime);

const getCurrentLocalMinutes = () => {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
};

const getRemainingTodayActivities = (activities: Activity[], limit: number) => {
  const today = getTodayISO();
  const nowMinutes = getCurrentLocalMinutes();

  return getActivitiesForDate(activities, today)
    .filter((activity) => {
      const startDate = activity.startDate ?? activity.date;
      const endDate = activity.endDate ?? startDate;

      return activity.allDay || today < endDate || parseTimeToMinutes(activity.endTime) > nowMinutes;
    })
    .slice(0, limit);
};

const getMealsForDate = (meals: Meal[], date: string) =>
  meals
    .filter((meal) => meal.date === date)
    .sort((firstMeal, secondMeal) => parseTimeToMinutes(secondMeal.time) - parseTimeToMinutes(firstMeal.time));

const getNutritionTotals = (mealsForDate: Meal[]): NutritionTotals =>
  mealsForDate.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

const getNutritionRangeStart = () => addDays(getTodayISO(), -365);

const getNutritionRangeEnd = () => addDays(getTodayISO(), 365);

const clampNutritionDate = (dateString: string) => {
  const rangeStart = getNutritionRangeStart();
  const rangeEnd = getNutritionRangeEnd();

  if (dateString < rangeStart) {
    return rangeStart;
  }

  if (dateString > rangeEnd) {
    return rangeEnd;
  }

  return dateString;
};

const getNutritionWindowStart = (centerDate: string) => {
  const rangeStart = getNutritionRangeStart();
  const rangeEnd = getNutritionRangeEnd();
  const latestStart = addDays(rangeEnd, -(NUTRITION_DATE_WINDOW_SIZE - 1));
  const desiredStart = addDays(clampNutritionDate(centerDate), -Math.floor(NUTRITION_DATE_WINDOW_SIZE / 2));

  if (desiredStart < rangeStart) {
    return rangeStart;
  }

  if (desiredStart > latestStart) {
    return latestStart;
  }

  return desiredStart;
};

const getNutritionWeekDays = (windowStartDate: string, selectedNutritionDate: string) => {
  const today = getTodayISO();
  const rangeStart = addDays(today, -365);
  const rangeEnd = addDays(today, 365);
  const totalDays = Math.min(
    NUTRITION_DATE_WINDOW_SIZE,
    Math.max(0, getDateDistance(windowStartDate, rangeEnd) + 1),
  );

  return Array.from({ length: totalDays }, (_, index) => {
    const dateString = addDays(windowStartDate < rangeStart ? rangeStart : windowStartDate, index);
    const date = parseLocalDate(dateString);
    const weekdayIndex = getMondayWeekdayIndex(dateString);

    return {
      dateString,
      dayLabel: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][weekdayIndex],
      dayNumber: date.getDate(),
      isSelected: dateString === selectedNutritionDate,
      isToday: isToday(dateString),
      isWeekend: weekdayIndex >= 5,
    };
  });
};

const getNutritionDateHeading = (dateString: string) => {
  const today = getTodayISO();

  if (dateString === today) {
    return 'Today';
  }

  if (dateString === addDays(today, -1)) {
    return 'Yesterday';
  }

  const date = parseLocalDate(dateString);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

const getCurrentTimeHHMM = () => {
  const now = new Date();

  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};

const hasMealsForDate = (meals: Meal[], date: string) => meals.some((meal) => meal.date === date);

const getMealStreak = (meals: Meal[], today: string) => {
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    if (!hasMealsForDate(meals, addDays(today, -offset))) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const createDraftMeal = (date: string): Meal => {
  return {
    id: `meal-${Date.now()}`,
    name: '',
    date,
    time: getCurrentTimeHHMM(),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    source: 'manual',
    category: 'Meal',
  };
};

const clampMacroInput = (value: string) => {
  const parsedValue = Number.parseInt(value.replace(/\D/g, ''), 10);

  return Number.isNaN(parsedValue) ? 0 : Math.max(0, parsedValue);
};

const getSleepColor = (minutes: number) => {
  if (minutes < 300) {
    return '#7f1d1d';
  }

  if (minutes < 360) {
    return '#ef4444';
  }

  if (minutes < 420) {
    return '#f59e0b';
  }

  if (minutes < 450) {
    return '#d9e64c';
  }

  if (minutes < 480) {
    return '#9ee23a';
  }

  if (minutes <= 510) {
    return '#22c55e';
  }

  if (minutes > 540) {
    return '#65a847';
  }

  return '#35c85a';
};

const getHydrationColor = (ml: number) => {
  if (ml <= 500) {
    return '#991b1b';
  }

  if (ml < 1500) {
    return '#f97316';
  }

  if (ml < 2500) {
    return '#b8ef2f';
  }

  if (ml < 3000) {
    return '#65c832';
  }

  return '#16a34a';
};

const getCaloriesColor = (calorieValue: number, calorieGoal: number) => {
  const target = Math.max(calorieGoal, 1);
  const ratio = calorieValue / target;

  if (ratio < 0.25) {
    return '#c65f54';
  }

  if (ratio < 0.5) {
    return '#f97316';
  }

  if (ratio < 0.75) {
    return '#facc15';
  }

  if (ratio <= 1.05) {
    return '#22c55e';
  }

  if (ratio <= 1.22) {
    return '#facc15';
  }

  if (ratio <= 1.45) {
    return '#d97706';
  }

  return '#9f3f46';
};

const getProductivityLeftColor = (progress: number) => {
  if (progress >= 0.65) {
    return '#22c55e';
  }

  if (progress >= 0.35) {
    return '#facc15';
  }

  if (progress >= 0.18) {
    return '#f97316';
  }

  return '#dc2626';
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalizedHex = hex.replace('#', '');
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
};

const getCalendarDays = (visibleMonthDate: string, selectedDate: string): CalendarDay[] => {
  const monthDate = parseLocalDate(visibleMonthDate);
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayIndex);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateString = toLocalISODate(date);
    return {
      dateString,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: isToday(dateString),
      isSelected: dateString === selectedDate,
    };
  });
};

const formatActivityTime = (activity: Activity) => {
  const startDate = activity.startDate ?? activity.date;
  const endDate = activity.endDate ?? startDate;

  if (activity.allDay) {
    return startDate === endDate ? 'All day' : `${formatDateChip(startDate)} \u2013 ${formatDateChip(endDate)}`;
  }

  if (startDate !== endDate) {
    return `${formatDateChip(startDate)} ${activity.startTime} \u2013 ${formatDateChip(endDate)} ${activity.endTime}`;
  }

  return `${activity.startTime} \u2013 ${activity.endTime}`;
};

const createDraftActivity = (date = getTodayISO()): ActivityDraft => {
  const now = new Date();
  const startHours = now.getHours();
  const startMinutes = now.getMinutes();
  const nextHour = startHours + 1;
  const endDate = nextHour >= 24 ? addDays(date, 1) : date;
  const endTime = nextHour >= 24 ? '00:00' : `${pad2(nextHour)}:00`;

  return {
    id: `activity-${Date.now()}`,
    title: '',
    description: '',
    date,
    startDate: date,
    endDate,
    startTime: `${pad2(startHours)}:${pad2(startMinutes)}`,
    endTime,
    category: 'Productivity',
    color: accent,
    allDay: false,
    repeat: 'none',
    customWeekdays: [getMondayWeekdayIndex(date)],
  };
};

const normalizeActivityDraft = (draft: ActivityDraft): ActivityDraft => {
  const startDate = draft.startDate ?? draft.date;
  let endDate = draft.endDate ?? startDate;
  let endTime = draft.endTime;

  if (endDate < startDate) {
    endDate = startDate;
  }

  if (endDate === startDate && parseTimeToMinutes(endTime) <= parseTimeToMinutes(draft.startTime)) {
    const nextEndMinutes = parseTimeToMinutes(draft.startTime) + 1;
    endDate = nextEndMinutes >= 1440 ? addDays(startDate, 1) : endDate;
    endTime = formatTimeFromMinutes(nextEndMinutes);
  }

  return {
    ...draft,
    date: startDate,
    startDate,
    endDate,
    endTime,
  };
};

const normalizeTimePart = (value: string, max: number) => {
  const numberValue = Number.parseInt(value.replace(/\D/g, ''), 10);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return Math.min(Math.max(numberValue, 0), max);
};

const buildTime = (hours: number, minutes: number) => `${pad2(hours)}:${pad2(minutes)}`;

const getTimeParts = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return {
    hours: Number.isFinite(hours) ? Math.min(Math.max(hours, 0), 23) : 0,
    minutes: Number.isFinite(minutes) ? Math.min(Math.max(minutes, 0), 59) : 0,
  };
};

const formatTimeFromMinutes = (minutes: number) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const adjustTime = (time: string, minutes: number) => formatTimeFromMinutes(parseTimeToMinutes(time) + minutes);

const formatDateChip = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${day} ${monthNames[month - 1]} ${year}`;
};

const todaySeedDate = getTodayISO();

const initialMeals: Meal[] = [
  {
    id: 'fried-chicken-bowl',
    name: 'Fried Chicken Bowl',
    date: todaySeedDate,
    time: '22:10',
    calories: 988,
    protein: 54,
    carbs: 39,
    fat: 60,
    source: 'manual',
    category: 'Dinner',
  },
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt',
    date: todaySeedDate,
    time: '08:20',
    calories: 240,
    protein: 22,
    carbs: 18,
    fat: 7,
    source: 'manual',
    category: 'Breakfast',
  },
  {
    id: 'chicken-wrap',
    name: 'Chicken Wrap',
    date: addDays(todaySeedDate, -1),
    time: '13:15',
    calories: 620,
    protein: 42,
    carbs: 58,
    fat: 24,
    source: 'manual',
    category: 'Lunch',
  },
  {
    id: 'protein-oats',
    name: 'Protein Oats',
    date: addDays(todaySeedDate, -2),
    time: '07:45',
    calories: 430,
    protein: 31,
    carbs: 52,
    fat: 12,
    source: 'manual',
    category: 'Breakfast',
  },
];

const initialActivities: Activity[] = [
  {
    id: 'design-review',
    title: 'Design Review',
    description:
      'Review the onboarding screens and finalize the spacing, typography, and interaction details for the next build.',
    date: todaySeedDate,
    startDate: todaySeedDate,
    endDate: todaySeedDate,
    startTime: '09:00',
    endTime: '10:30',
    category: 'Productivity',
    color: accent,
    allDay: false,
    repeat: 'none',
  },
  {
    id: 'focus-time',
    title: 'Focus Time',
    description: 'Protected focus block for priority product work, planning, and careful follow-through.',
    date: todaySeedDate,
    startDate: todaySeedDate,
    endDate: todaySeedDate,
    startTime: '13:00',
    endTime: '15:00',
    category: 'Productivity',
    color: '#716dff',
    allDay: false,
    repeat: 'none',
  },
  {
    id: 'workout-session',
    title: 'Workout Session',
    description:
      'Strength training and light cardio. Focus on consistency and keep the session balanced and efficient.',
    date: addDays(todaySeedDate, 1),
    startDate: addDays(todaySeedDate, 1),
    endDate: addDays(todaySeedDate, 1),
    startTime: '17:30',
    endTime: '18:30',
    category: 'Health',
    color: '#5d8cff',
    allDay: false,
    repeat: 'none',
  },
  {
    id: 'deep-work',
    title: 'Deep Work',
    description: 'A quiet work session for solving the hardest open task without context switching.',
    date: addDays(todaySeedDate, 2),
    startDate: addDays(todaySeedDate, 2),
    endDate: addDays(todaySeedDate, 2),
    startTime: '10:00',
    endTime: '12:00',
    category: 'Productivity',
    color: '#ffa43b',
    allDay: false,
    repeat: 'none',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingStat, setEditingStat] = useState<EditableStatKey | null>(null);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [visibleMonthDate, setVisibleMonthDate] = useState(getMonthStartISO(getTodayISO()));
  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>('month');
  const [weekZoom, setWeekZoom] = useState(1);
  const [activityModalMode, setActivityModalMode] = useState<ActivityModalMode | null>(null);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft | null>(null);
  const [sleepMinutes, setSleepMinutes] = useState(480);
  const [sleepStep, setSleepStep] = useState<SleepStep>(15);
  const [calorieStep, setCalorieStep] = useState<CalorieStep>(10);
  const [hydrationMl, setHydrationMl] = useState(2100);
  const [calories, setCalories] = useState(1642);
  const [calorieGoal] = useState(3000);
  const [selectedNutritionDate, setSelectedNutritionDate] = useState(getTodayISO());
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [mealModalMode, setMealModalMode] = useState<MealModalMode | null>(null);
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [mealDraft, setMealDraft] = useState<Meal | null>(null);
  const [scannerPlaceholderVisible, setScannerPlaceholderVisible] = useState(false);
  const activeTheme = isDarkMode ? darkTheme : lightTheme;
  const sleepColor = getSleepColor(sleepMinutes);
  const productivityLeftProgress = 0.62;

  const stats: Stat[] = [
    {
      label: 'Sleep',
      value: formatSleep(sleepMinutes),
      icon: 'bed',
      progress: Math.min(sleepMinutes / 780, 1),
      editable: true,
      accentColor: sleepColor,
    },
    {
      label: 'Prod. Left',
      value: '5h',
      icon: 'timer',
      progress: productivityLeftProgress,
      accentColor: getProductivityLeftColor(productivityLeftProgress),
    },
    {
      label: 'Hydration',
      value: formatHydration(hydrationMl),
      icon: 'water',
      progress: Math.min(hydrationMl / 3400, 1),
      editable: true,
      accentColor: getHydrationColor(hydrationMl),
    },
    {
      label: 'Calories',
      value: formatCalories(calories),
      icon: 'flame',
      progress: Math.min(calories / calorieGoal, 1),
      editable: true,
      accentColor: getCaloriesColor(calories, calorieGoal),
    },
  ];

  const incrementStat = () => {
    if (editingStat === 'Hydration') {
      setHydrationMl((value) => value + 100);
    }

    if (editingStat === 'Sleep') {
      setSleepMinutes((value) => value + sleepStep);
    }

    if (editingStat === 'Calories') {
      setCalories((value) => value + calorieStep);
    }
  };

  const decrementStat = () => {
    if (editingStat === 'Hydration') {
      setHydrationMl((value) => Math.max(0, value - 100));
    }

    if (editingStat === 'Sleep') {
      setSleepMinutes((value) => Math.max(0, value - sleepStep));
    }

    if (editingStat === 'Calories') {
      setCalories((value) => Math.max(0, value - calorieStep));
    }
  };

  const modalValue =
    editingStat === 'Sleep'
      ? formatSleep(sleepMinutes)
      : editingStat === 'Hydration'
        ? formatHydration(hydrationMl)
        : editingStat === 'Calories'
          ? formatCalories(calories)
          : '';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeTheme.safeAreaBg }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={[styles.phoneFrame, { backgroundColor: activeTheme.phoneBg }]}>
        {activeTab === 'Activity' ? (
          <CalendarScreen
            activeTheme={activeTheme}
            activities={activities}
            selectedDate={selectedDate}
            visibleMonthDate={visibleMonthDate}
            activityViewMode={activityViewMode}
            weekZoom={weekZoom}
            onSelectDate={setSelectedDate}
            onChangeVisibleMonthDate={setVisibleMonthDate}
            onChangeActivityViewMode={setActivityViewMode}
            onChangeWeekZoom={setWeekZoom}
            onGoToToday={() => {
              const today = getTodayISO();
              setSelectedDate(today);
              setVisibleMonthDate(getMonthStartISO(today));
            }}
            onNewActivity={() => {
              setActivityDraft(createDraftActivity(selectedDate));
              setActivityModalMode('new');
            }}
            onEditActivity={(activity) => {
              setActivityDraft(normalizeActivityDraft({ ...activity }));
              setActivityModalMode('edit');
            }}
          />
        ) : activeTab === 'Nutrition' ? (
          <NutritionScreen
            activeTheme={activeTheme}
            selectedDate={selectedNutritionDate}
            meals={meals}
            onSelectDate={setSelectedNutritionDate}
            onAddMeal={() => {
              setMealDraft(createDraftMeal(selectedNutritionDate));
              setMealModalMode('new');
              setMealModalVisible(true);
            }}
            onEditMeal={(meal) => {
              setMealDraft({ ...meal });
              setMealModalMode('edit');
              setMealModalVisible(true);
            }}
          />
        ) : activeTab === 'Profile' ? (
          <ProfileScreen
            activeTheme={activeTheme}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((value) => !value)}
          />
        ) : (
          <HomeScreen
            activeTheme={activeTheme}
            stats={stats}
            activities={activities}
            onEditActivity={(activity) => {
              setActivityDraft(normalizeActivityDraft({ ...activity }));
              setActivityModalMode('edit');
            }}
            onNewActivity={() => {
              setActivityDraft(createDraftActivity(getTodayISO()));
              setActivityModalMode('new');
            }}
            onEditStat={setEditingStat}
          />
        )}
        <BottomTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          activeTheme={activeTheme}
          onQrPress={() => setScannerPlaceholderVisible(true)}
        />
      </View>

      <StatEditorModal
        activeTheme={activeTheme}
        visible={editingStat !== null}
        title={editingStat ?? ''}
        value={modalValue}
        sleepStep={sleepStep}
        calorieStep={calorieStep}
        onChangeSleepStep={setSleepStep}
        onChangeCalorieStep={setCalorieStep}
        onIncrement={incrementStat}
        onDecrement={decrementStat}
        onClose={() => setEditingStat(null)}
      />
      <ActivityEditorModal
        activeTheme={activeTheme}
        visible={activityModalMode !== null && activityDraft !== null}
        draft={activityDraft}
        isEditing={activityModalMode === 'edit'}
        onChangeDraft={setActivityDraft}
        onClose={() => {
          setActivityDraft(null);
          setActivityModalMode(null);
        }}
        onSave={(savedDraft) => {
          const normalizedDraft = normalizeActivityDraft(savedDraft);
          setActivities((current) =>
            activityModalMode === 'edit'
              ? current.map((activity) => (activity.id === normalizedDraft.id ? normalizedDraft : activity))
              : [...current, normalizedDraft],
          );
          setActivityDraft(null);
          setActivityModalMode(null);
        }}
        onDelete={(activityId) => {
          setActivities((current) => current.filter((activity) => activity.id !== activityId));
          setActivityDraft(null);
          setActivityModalMode(null);
        }}
      />
      <MealEditorModal
        activeTheme={activeTheme}
        visible={mealModalVisible && mealDraft !== null}
        draft={mealDraft}
        onChangeDraft={setMealDraft}
        onClose={() => {
          setMealModalVisible(false);
          setMealModalMode(null);
          setMealDraft(null);
        }}
        onSave={(savedMeal) => {
          const mealName = savedMeal.name.trim() || 'Manual meal';
          const normalizedMeal = {
            ...savedMeal,
            name: mealName,
            time: formatTimeFromMinutes(safeParseMinutes(savedMeal.time, getCurrentLocalMinutes())),
            calories: Math.max(0, Math.trunc(savedMeal.calories || 0)),
            protein: Math.max(0, Math.trunc(savedMeal.protein || 0)),
            carbs: Math.max(0, Math.trunc(savedMeal.carbs || 0)),
            fat: Math.max(0, Math.trunc(savedMeal.fat || 0)),
            source: 'manual' as MealSource,
          };
          setMeals((current) =>
            mealModalMode === 'edit'
              ? current.map((meal) => (meal.id === normalizedMeal.id ? normalizedMeal : meal))
              : [...current, normalizedMeal],
          );
          setMealModalVisible(false);
          setMealModalMode(null);
          setMealDraft(null);
        }}
        isEditing={mealModalMode === 'edit'}
        onDelete={(mealId) => {
          setMeals((current) => current.filter((meal) => meal.id !== mealId));
          setMealModalVisible(false);
          setMealModalMode(null);
          setMealDraft(null);
        }}
      />
      <ScannerPlaceholderModal
        activeTheme={activeTheme}
        visible={scannerPlaceholderVisible}
        onClose={() => setScannerPlaceholderVisible(false)}
      />
    </SafeAreaView>
  );
}

function ThemeToggle({
  activeTheme,
  isDarkMode,
  onToggleTheme,
}: {
  activeTheme: Theme;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onToggleTheme}
      style={[
        styles.themeButton,
        {
          backgroundColor: activeTheme.iconButtonBg,
          borderColor: activeTheme.iconButtonBorder,
        },
      ]}
    >
      <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={19} color={activeTheme.iconButtonColor} />
    </TouchableOpacity>
  );
}

function HomeScreen({
  activeTheme,
  stats,
  activities,
  onEditActivity,
  onNewActivity,
  onEditStat,
}: {
  activeTheme: Theme;
  stats: Stat[];
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onNewActivity: () => void;
  onEditStat: (stat: EditableStatKey) => void;
}) {
  const nextActivities = getRemainingTodayActivities(activities, 3);
  const hasRemainingActivities = nextActivities.length > 0;

  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.52, 1]} style={styles.homeContent}>
      <View style={styles.homeHeader}>
        <View style={styles.homeTitleBlock}>
          <Text style={[styles.homePageTitle, { color: activeTheme.titleText }]}>Today</Text>
        </View>

        <View style={styles.homeHeaderActions}>
          <TouchableOpacity
            activeOpacity={0.82}
            style={[
              styles.homeActionButton,
              {
                backgroundColor: activeTheme.iconButtonBg,
                borderColor: activeTheme.iconButtonBorder,
              },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={activeTheme.iconButtonColor} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onNewActivity}
            style={[
              styles.homeActionButton,
              {
                backgroundColor: accent,
                borderColor: 'rgba(184,239,47,0.36)',
                shadowColor: accent,
                shadowOpacity: activeTheme.mode === 'dark' ? 0.48 : 0.22,
              },
            ]}
          >
            <Ionicons name="add" size={25} color="#111111" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.activityCards}
        contentContainerStyle={styles.activityCardsContent}
        showsVerticalScrollIndicator={false}
      >
        {hasRemainingActivities ? (
          nextActivities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            activeOpacity={0.86}
            onPress={() => onEditActivity(activity)}
            style={styles.activityTouchable}
          >
            <LinearGradient
              colors={
                activeTheme.mode === 'dark'
                  ? ['rgba(31,35,34,0.50)', 'rgba(16,18,19,0.43)', 'rgba(16,18,19,0.32)']
                  : ['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.63)', 'rgba(250,252,246,0.50)']
              }
              locations={[0, 0.56, 1]}
              style={[
                styles.homeActivityCard,
                {
                  borderColor:
                    activeTheme.mode === 'dark'
                      ? hexToRgba(activity.color, 0.15)
                      : hexToRgba(activity.color, 0.08),
                  shadowColor: activeTheme.mode === 'dark' ? activity.color : activeTheme.shadowColor,
                  shadowOpacity: activeTheme.mode === 'dark' ? 0.16 : 0.09,
                },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.activityGlassSheen,
                  {
                    backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.58)',
                  },
                ]}
              />
              <View
                style={[
                  styles.activityEdgeGlow,
                  {
                    backgroundColor: hexToRgba(activity.color, activeTheme.mode === 'dark' ? 0.22 : 0.08),
                  },
                ]}
              />
              <LinearGradient
                pointerEvents="none"
                colors={[
                  hexToRgba(activity.color, activeTheme.mode === 'dark' ? 0.18 : 0.06),
                  hexToRgba(activity.color, 0),
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.activityEdgeFade}
              />
              <View style={styles.activityTextBlock}>
                <View style={styles.activityCardHeader}>
                  <Text style={[styles.activityTitle, { color: activeTheme.titleText }]} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityTime, { color: activeTheme.mutedText }]} numberOfLines={1}>
                    {formatActivityTime(activity)}
                  </Text>
                </View>
                <Text style={[styles.activityDescription, { color: activeTheme.secondaryText }]} numberOfLines={2}>
                  {activity.description}
                </Text>
              </View>

              <View
                style={[
                  styles.activityAccent,
                  { backgroundColor: activity.color },
                ]}
              />
            </LinearGradient>
          </TouchableOpacity>
          ))
        ) : (
          <View
            style={[
              styles.homeEmptyActivityCard,
              {
                backgroundColor: activeTheme.modalValueBg,
                borderColor: activeTheme.mode === 'dark' ? 'rgba(184,239,47,0.13)' : 'rgba(184,239,47,0.16)',
                shadowColor: accent,
                shadowOpacity: activeTheme.mode === 'dark' ? 0.1 : 0.05,
              },
            ]}
          >
            <View style={[styles.emptyAgendaIcon, { backgroundColor: activeTheme.statIconBg }]}>
              <Ionicons name="checkmark-done" size={18} color={accent} />
            </View>
            <View style={styles.emptyAgendaTextBlock}>
              <Text style={[styles.emptyAgendaTitle, { color: activeTheme.titleText }]}>All clear</Text>
              <Text style={[styles.emptyActivitiesText, { color: activeTheme.mutedText }]}>
                No activities left for today
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <LinearGradient
        colors={activeTheme.statsGradient}
        style={[
          styles.statsCard,
          {
            borderColor: activeTheme.mode === 'dark' ? 'rgba(184,239,47,0.16)' : 'rgba(184,239,47,0.12)',
            shadowColor: activeTheme.mode === 'dark' ? accent : activeTheme.shadowColor,
            shadowOpacity: activeTheme.mode === 'dark' ? 0.16 : 0.08,
          },
        ]}
      >
        <Text style={styles.statsTitle}>Today's Stats</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            (() => {
              const statAccent = stat.accentColor ?? accent;

              return (
            <TouchableOpacity
              key={stat.label}
              activeOpacity={stat.editable ? 0.74 : 1}
              disabled={!stat.editable}
              onPress={() => stat.editable && onEditStat(stat.label as EditableStatKey)}
              style={[
                styles.statItem,
                index % 2 === 0 && styles.statLeft,
                index % 2 === 1 && styles.statRight,
                index < 2 && styles.statTop,
                index % 2 === 0 && { borderRightColor: activeTheme.divider },
              ]}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: stat.accentColor ? hexToRgba(statAccent, 0.18) : activeTheme.statIconBg },
                ]}
              >
                <Ionicons name={stat.icon} size={18} color={statAccent} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={[styles.statLabel, { color: activeTheme.secondaryText }]}>{stat.label}</Text>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, { color: stat.accentColor ?? activeTheme.titleText }]}>
                    {stat.value.split(' ')[0]}
                  </Text>
                  {stat.value.includes(' ') && (
                    <Text style={[styles.statUnit, { color: activeTheme.titleText }]}>
                      {stat.value.split(' ').slice(1).join(' ')}
                    </Text>
                  )}
                </View>
                <View style={[styles.statTrack, { backgroundColor: activeTheme.statTrack }]}>
                  <View style={[styles.statFill, { width: `${stat.progress * 100}%`, backgroundColor: statAccent }]} />
                </View>
              </View>
            </TouchableOpacity>
              );
            })()
          ))}
        </View>
      </LinearGradient>
    </LinearGradient>
  );
}

function CalendarScreen({
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
      <View style={styles.calendarTop}>
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
        <View style={styles.calendarActions}>
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
          <TouchableOpacity activeOpacity={0.82} onPress={onNewActivity} style={styles.addButton}>
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

function WeekTimeline({
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

const formatMealTime = (time: string) => {
  const minutes = safeParseMinutes(time, 0);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${pad2(mins)} ${period}`;
};

function NutritionRing({
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

function MacroGlyph({ type, color, size }: { type: 'protein' | 'carbs' | 'fat'; color: string; size: number }) {
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

function NutritionScreen({
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

  useEffect(() => {
    if (nutritionDateViewportWidth <= 0) {
      return;
    }

    const nextWindowStart = getNutritionWindowStart(selectedDate);
    if (selectedDate < nutritionWindowStartDate || selectedDate > addDays(nutritionWindowStartDate, NUTRITION_DATE_WINDOW_SIZE - 1)) {
      setNutritionWindowStartDate(nextWindowStart);
      return;
    }

    const targetDate = pendingNutritionCenterDate.current ?? selectedDate;
    pendingNutritionCenterDate.current = null;
    const selectedIndex = getDateDistance(nutritionWindowStartDate, targetDate);
    const scrollTimer = setTimeout(() => {
      if (selectedIndex >= 0) {
        const centeredOffset = Math.max(
          0,
          selectedIndex * NUTRITION_DATE_ITEM_WIDTH - (nutritionDateViewportWidth - NUTRITION_DATE_CARD_WIDTH) / 2,
        );
        nutritionListRef.current?.scrollToOffset({ offset: centeredOffset, animated: false });
      }
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

  const updateVisibleNutritionMonthFromScroll = (scrollX: number, viewportWidth: number) => {
    const centerIndex = Math.min(
      weekDays.length - 1,
      Math.max(0, Math.round((scrollX + viewportWidth / 2) / NUTRITION_DATE_ITEM_WIDTH)),
    );
    const centerDate = weekDays[centerIndex]?.dateString;

    if (!centerDate) {
      return;
    }

    const nextMonth = getMonthStartISO(centerDate);
    setVisibleNutritionMonthDate((currentMonth) => (currentMonth === nextMonth ? currentMonth : nextMonth));
  };

  const shiftNutritionWindowIfNeeded = (scrollX: number, viewportWidth: number) => {
    const centerIndex = Math.round((scrollX + viewportWidth / 2) / NUTRITION_DATE_ITEM_WIDTH);
    const centerDate = weekDays[Math.min(weekDays.length - 1, Math.max(0, centerIndex))]?.dateString;

    if (!centerDate) {
      return;
    }

    if (centerIndex < 12 || centerIndex > NUTRITION_DATE_WINDOW_SIZE - 13) {
      setNutritionWindowStartDate((currentStart) => {
        const nextStart = getNutritionWindowStart(centerDate);

        if (nextStart !== currentStart) {
          pendingNutritionCenterDate.current = centerDate;
        }

        return nextStart === currentStart ? currentStart : nextStart;
      });
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
        <View style={styles.nutritionHeader}>
          <Text style={[styles.nutritionTitle, { color: activeTheme.titleText }]}>Nutrition</Text>
          <View style={styles.nutritionHeaderActions}>
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
            <TouchableOpacity activeOpacity={0.82} onPress={onAddMeal} style={styles.nutritionAddButton}>
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
              const todayIndex = getDateDistance(todayWindowStart, today);
              setNutritionWindowStartDate(todayWindowStart);
              onSelectDate(today);
              setVisibleNutritionMonthDate(getMonthStartISO(today));
              if (nutritionDateViewportWidth > 0) {
                const centeredOffset = Math.max(
                  0,
                  todayIndex * NUTRITION_DATE_ITEM_WIDTH - (nutritionDateViewportWidth - NUTRITION_DATE_CARD_WIDTH) / 2,
                );
                requestAnimationFrame(() => nutritionListRef.current?.scrollToOffset({ offset: centeredOffset, animated: true }));
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
            style={styles.nutritionWeekScroll}
            contentContainerStyle={[
              styles.nutritionWeekRow,
              nutritionDateViewportWidth > 0 && {
                paddingLeft: Math.max(0, (nutritionDateViewportWidth - NUTRITION_DATE_CARD_WIDTH) / 2),
                paddingRight: Math.max(24, (nutritionDateViewportWidth - NUTRITION_DATE_CARD_WIDTH) / 2),
              },
            ]}
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
              updateVisibleNutritionMonthFromScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.layoutMeasurement.width);
            }}
            onMomentumScrollEnd={(event) => {
              shiftNutritionWindowIfNeeded(event.nativeEvent.contentOffset.x, event.nativeEvent.layoutMeasurement.width);
            }}
            onScrollEndDrag={(event) => {
              shiftNutritionWindowIfNeeded(event.nativeEvent.contentOffset.x, event.nativeEvent.layoutMeasurement.width);
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

function ProfileScreen({
  activeTheme,
  isDarkMode,
  onToggleTheme,
}: {
  activeTheme: Theme;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.52, 1]} style={styles.profileContent}>
      <View style={styles.profileHeader}>
        <Text style={[styles.profileTitle, { color: activeTheme.titleText }]}>Profile</Text>
        <View style={[styles.profileAvatar, { backgroundColor: activeTheme.statIconBg }]}>
          <Ionicons name="person" size={30} color={accent} />
        </View>
      </View>

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.cardBorder,
            shadowColor: activeTheme.shadowColor,
          },
        ]}
      >
        <Text style={[styles.profileName, { color: activeTheme.titleText }]}>Simon Spielberg</Text>
        <Text style={[styles.profileMeta, { color: activeTheme.mutedText }]}>HealthPro prototype</Text>
      </View>

      <View
        style={[
          styles.settingCard,
          {
            backgroundColor: activeTheme.cardBg,
            borderColor: activeTheme.cardBorder,
            shadowColor: activeTheme.shadowColor,
          },
        ]}
      >
        <View>
          <Text style={[styles.settingLabel, { color: activeTheme.titleText }]}>Appearance</Text>
          <Text style={[styles.settingHint, { color: activeTheme.mutedText }]}>
            {isDarkMode ? 'Dark mode' : 'Light mode'}
          </Text>
        </View>
        <ThemeToggle activeTheme={activeTheme} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
      </View>
    </LinearGradient>
  );
}

function StatEditorModal({
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

function MealEditorModal({
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
  draft: Meal | null;
  isEditing: boolean;
  onChangeDraft: (draft: Meal) => void;
  onClose: () => void;
  onSave: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
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
            style={[styles.scannerSoonButton, { backgroundColor: activeTheme.modalValueBg, borderColor: activeTheme.cardBorder }]}
          >
            <Ionicons name="scan-outline" size={17} color={activeTheme.mutedText} />
            <Text style={[styles.scannerSoonText, { color: activeTheme.mutedText }]}>Scanner coming soon</Text>
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

function ScannerPlaceholderModal({
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

function ActivityEditorModal({
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

            <View style={[styles.activityFormRow, styles.formDivider, { borderTopColor: activeTheme.divider }]}>
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

function BottomTabs({
  activeTab,
  onChange,
  activeTheme,
  onQrPress,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  activeTheme: Theme;
  onQrPress: () => void;
}) {
  const dark = activeTheme.mode === 'dark';
  const showQrButton = activeTab === 'Nutrition';

  return (
    <View
      style={[
        styles.tabBar,
        dark ? styles.darkTabBar : styles.lightTabBar,
        showQrButton && styles.tabBarWithQr,
        {
          backgroundColor: activeTheme.tabBg,
          borderTopColor: activeTheme.divider,
          shadowColor: activeTheme.shadowColor,
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const active = tab.key === activeTab;
        const color = active ? accent : activeTheme.tabMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.76}
            style={[
              styles.tabButton,
              showQrButton && index === 1 && styles.tabButtonBeforeQr,
              showQrButton && index === 2 && styles.tabButtonAfterQr,
            ]}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons name={active ? tab.activeIcon : tab.icon} size={25} color={color} />
            <Text style={[styles.tabText, { color: active ? accent : activeTheme.tabText }]}>{tab.key}</Text>
          </TouchableOpacity>
        );
      })}
      {showQrButton && (
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={onQrPress}
          style={[
            styles.tabQrButton,
            {
              backgroundColor: activeTheme.mode === 'dark' ? 'rgba(31,33,35,0.94)' : 'rgba(255,255,255,0.96)',
              borderColor: accent,
              shadowColor: accent,
            },
          ]}
        >
          <Ionicons name="qr-code-outline" size={28} color={activeTheme.mode === 'dark' ? '#ffffff' : '#111111'} />
        </TouchableOpacity>
      )}
      <View style={[styles.homeIndicator, { backgroundColor: activeTheme.homeIndicator }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    overflow: 'hidden',
  },
  homeContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 122,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  homeTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  homePageTitle: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: 0,
    opacity: 0.46,
  },
  homeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  homeActionButton: {
    width: 51,
    height: 51,
    marginTop: -1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 7,
  },
  activityCards: {
    flex: 1,
    marginTop: 24,
    marginHorizontal: -4,
  },
  activityCardsContent: {
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    flexGrow: 1,
  },
  homeEmptyActivityCard: {
    minHeight: 94,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTouchable: {
    borderRadius: 24,
  },
  homeActivityCard: {
    minHeight: 100,
    borderRadius: 24,
    paddingLeft: 24,
    paddingRight: 18,
    paddingVertical: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 22,
    elevation: 9,
  },
  activityGlassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    opacity: 0.62,
  },
  activityEdgeGlow: {
    position: 'absolute',
    left: 0,
    top: 15,
    bottom: 15,
    width: 13,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  activityEdgeFade: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 82,
  },
  activityTextBlock: {
    flex: 1,
    marginLeft: 0,
    paddingRight: 4,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  activityTime: {
    flexShrink: 0,
    maxWidth: 126,
    textAlign: 'right',
    fontSize: 15,
    lineHeight: 20,
  },
  activityDescription: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 18,
  },
  activityAccent: {
    position: 'absolute',
    left: 0,
    top: 21,
    bottom: 21,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.9,
  },
  statsCard: {
    minHeight: 222,
    marginTop: 18,
    marginBottom: 24,
    borderRadius: 23,
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 14,
  },
  statsTitle: {
    marginBottom: 19,
    color: accent,
    fontSize: 19,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLeft: {
    paddingRight: 19,
    borderRightWidth: 1,
  },
  statRight: {
    paddingLeft: 21,
  },
  statTop: {
    marginBottom: 28,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  statValueRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 29,
  },
  statUnit: {
    marginLeft: 4,
    marginBottom: 3,
    fontSize: 13,
    lineHeight: 17,
  },
  statTrack: {
    height: 4,
    marginTop: 11,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: accent,
  },
  calendarContent: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 28,
    paddingBottom: 130,
  },
  calendarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 204,
    flexShrink: 0,
  },
  monthTitle: {
    width: 116,
    marginHorizontal: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0,
    opacity: 0.82,
  },
  monthNavButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  todayButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5f5b4',
  },
  weekHeader: {
    marginTop: 36,
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    marginTop: 24,
  },
  weekModeRow: {
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
  },
  weekDayCard: {
    flex: 1,
    height: 70,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },
  weekDayNumber: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  weekDotRow: {
    height: 6,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  weekActivityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  weekTimelinePanel: {
    marginTop: 18,
    height: TIMELINE_VIEWPORT_HEIGHT,
    borderRadius: 27,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 0,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },
  timelineVerticalScroll: {
    flex: 1,
  },
  timelineVerticalContent: {
    paddingBottom: 18,
  },
  weekAllDaySection: {
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 10,
  },
  allDayTimelineCard: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  allDayTimelineText: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timelineScroll: {
    width: '100%',
  },
  timelineScrollContent: {
    paddingHorizontal: 16,
    flexGrow: 0,
  },
  timelineContent: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
  },
  timelineHourRow: {
    height: 32,
    position: 'relative',
  },
  timelineHourMarker: {
    position: 'absolute',
    top: 0,
  },
  timelineHourText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  timelineGridWrap: {
    marginTop: 6,
    position: 'relative',
    width: TIMELINE_WIDTH,
  },
  timelineGuideLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dotted',
    borderLeftColor: 'rgba(148,148,148,0.19)',
  },
  timelineActivityCard: {
    position: 'absolute',
    height: CARD_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  timelineCardAccent: {
    width: 4,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  timelineCardText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timelineCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  timelineCardMeta: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
  },
  weekEmptyState: {
    minHeight: 440,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  weekZoomResetButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekEmptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  calendarWeek: {
    height: 64,
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  datePill: {
    width: 45,
    height: 43,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateActivityDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  datePillSelected: {
    backgroundColor: accent,
  },
  todayDatePill: {
    borderWidth: 1,
    borderColor: 'rgba(184,239,47,0.58)',
    backgroundColor: 'rgba(184,239,47,0.07)',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '500',
  },
  selectedDate: {
    color: '#101010',
    fontWeight: '700',
  },
  weekendDate: {
    color: '#c66f6f',
  },
  eventsPanel: {
    marginHorizontal: -28,
    marginTop: 5,
    borderTopWidth: 1,
    flex: 1,
  },
  eventsPanelContent: {
    paddingHorizontal: 28,
    paddingTop: 25,
    paddingBottom: 138,
  },
  todayTitle: {
    marginBottom: 18,
    color: '#8bd314',
    fontSize: 17,
    fontWeight: '600',
  },
  eventRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventDot: {
    width: 10,
    height: 10,
    marginTop: 11,
    borderRadius: 5,
  },
  eventTime: {
    width: 104,
    marginLeft: 18,
    fontSize: 16,
    lineHeight: 30,
  },
  eventDetails: {
    flex: 1,
    minHeight: 56,
    paddingBottom: 16,
  },
  eventDivider: {
    borderBottomWidth: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
  },
  eventMeta: {
    fontSize: 15,
    lineHeight: 20,
  },
  emptyActivitiesText: {
    fontSize: 16,
    lineHeight: 22,
  },
  emptyAgendaCard: {
    minHeight: 78,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyAgendaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAgendaTextBlock: {
    flex: 1,
    marginLeft: 14,
  },
  emptyAgendaTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  nutritionContent: {
    flex: 1,
  },
  nutritionFixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    paddingHorizontal: 27,
    paddingTop: 68,
    paddingBottom: 34,
  },
  nutritionBodyScroll: {
    flex: 1,
  },
  nutritionBodyContent: {
    paddingHorizontal: 27,
    paddingTop: NUTRITION_FIXED_HEADER_HEIGHT,
    paddingBottom: 172,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  nutritionTitle: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    opacity: 0.84,
  },
  nutritionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nutritionDateHeader: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nutritionMonthLabel: {
    width: 132,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    opacity: 0.76,
  },
  streakPill: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.78,
  },
  nutritionAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accent,
    shadowColor: accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  nutritionWeekRow: {
    paddingHorizontal: 1,
    paddingRight: 24,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 7,
  },
  nutritionDateScrollerFrame: {
    height: 88,
    marginTop: 14,
    marginHorizontal: -1,
    marginBottom: 20,
    overflow: 'visible',
  },
  nutritionWeekScroll: {
    height: 88,
    flexGrow: 0,
    overflow: 'visible',
  },
  nutritionDateCard: {
    width: NUTRITION_DATE_CARD_WIDTH,
    height: 70,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  caloriesCard: {
    minHeight: 150,
    marginTop: 0,
    borderRadius: 28,
    paddingHorizontal: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  caloriesLeftNumber: {
    fontSize: 46,
    fontWeight: '700',
    lineHeight: 54,
    opacity: 0.86,
  },
  caloriesLeftLabel: {
    marginTop: 4,
    fontSize: 17,
    lineHeight: 22,
    opacity: 0.82,
  },
  nutritionRing: {
    borderWidth: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionRingArc: {
    position: 'absolute',
    borderWidth: 12,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  nutritionRingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fatGlyph: {
    position: 'relative',
  },
  fatBubble: {
    position: 'absolute',
    opacity: 0.92,
    shadowColor: fatColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  carbsGlyph: {
    position: 'relative',
    alignItems: 'center',
  },
  carbsStem: {
    position: 'absolute',
    top: '12%',
    bottom: '8%',
    width: 2,
    borderRadius: 2,
  },
  grainLeft: {
    position: 'absolute',
    left: '16%',
    width: '34%',
    height: '20%',
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    transform: [{ rotate: '-32deg' }],
    shadowColor: carbsColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  grainRight: {
    position: 'absolute',
    right: '16%',
    width: '34%',
    height: '20%',
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    transform: [{ rotate: '32deg' }],
    shadowColor: carbsColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  macroGrid: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 11,
  },
  macroCard: {
    flex: 1,
    minHeight: 148,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    opacity: 0.86,
  },
  macroLabel: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 17,
    opacity: 0.82,
  },
  nutritionCarouselDots: {
    marginTop: 8,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 9,
  },
  nutritionCarouselDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  recentTitle: {
    marginTop: 15,
    marginBottom: 9,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
    opacity: 0.9,
  },
  mealCard: {
    minHeight: 118,
    borderRadius: 25,
    borderWidth: 1,
    padding: 17,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 10,
  },
  mealCardStack: {
    marginTop: 9,
  },
  mealCardBody: {
    flex: 1,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    opacity: 0.9,
  },
  mealTimePill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTimeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealCaloriesRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCaloriesText: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9,
  },
  mealMacrosRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mealMacroText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mealMacroDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 3,
  },
  nutritionEmptyCard: {
    minHeight: 92,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nutritionEmptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 27,
    paddingTop: 68,
    paddingBottom: 120,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileTitle: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    marginTop: 28,
    borderRadius: 27,
    padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  profileName: {
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 32,
  },
  profileMeta: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
  },
  settingCard: {
    minHeight: 86,
    marginTop: 18,
    borderRadius: 25,
    paddingHorizontal: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 7,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  settingHint: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  activityModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 82,
  },
  mealSheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 18,
  },
  mealSheetHeader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealInputCard: {
    marginTop: 14,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
  },
  mealNameInput: {
    height: 38,
    borderBottomWidth: 1,
    fontSize: 21,
    fontWeight: '600',
    paddingVertical: 0,
  },
  mealFieldGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealField: {
    width: '47.5%',
  },
  mealFieldLabel: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mealNumberInput: {
    height: 38,
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  mealMetaCard: {
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealDateControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  mealTodayChip: {
    minHeight: 34,
    minWidth: 130,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  mealTimeInput: {
    width: 112,
    height: 38,
    borderRadius: 15,
    paddingHorizontal: 13,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  scannerSoonButton: {
    marginTop: 10,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scannerSoonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealDeleteButton: {
    marginTop: 12,
  },
  scannerPlaceholderCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 18,
  },
  scannerPlaceholderIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
  scannerPlaceholderTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  scannerPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  scannerPlaceholderDone: {
    minHeight: 42,
    marginTop: 20,
    paddingHorizontal: 28,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accent,
  },
  scannerPlaceholderDoneText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
  },
  activitySheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 22,
  },
  sheetHandle: {
    width: 46,
    height: 4,
    alignSelf: 'center',
    borderRadius: 3,
    opacity: 0.8,
  },
  sheetHeader: {
    height: 52,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetRoundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accent,
  },
  sheetTitle: {
    position: 'absolute',
    left: 62,
    right: 62,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  activityInputCard: {
    minHeight: 108,
    marginTop: 9,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
    borderWidth: 1,
  },
  activityTitleInput: {
    height: 36,
    borderBottomWidth: 1,
    fontSize: 21,
    fontWeight: '500',
    paddingVertical: 0,
  },
  activityDescriptionInput: {
    minHeight: 44,
    marginTop: 11,
    fontSize: 17,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'top',
  },
  activityFormCard: {
    marginTop: 12,
    borderRadius: 22,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  activityFormRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formDivider: {
    borderTopWidth: 1,
  },
  formRowLabel: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 23,
  },
  allDaySwitch: {
    width: 58,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  allDayKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  formChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formChip: {
    minWidth: 78,
    height: 35,
    paddingHorizontal: 11,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formChipActive: {
    shadowColor: accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  formChipText: {
    color: accent,
    fontSize: 14,
    fontWeight: '600',
  },
  formChipTextActive: {
    color: '#111111',
  },
  timeEditor: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  dateSelector: {
    minHeight: 50,
    paddingVertical: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateStepButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorLabel: {
    flex: 1,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateTodayButton: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accent,
  },
  dateTodayText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },
  timeEditorLabel: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  timeUnitBlock: {
    alignItems: 'center',
    gap: 4,
  },
  timeNudgeButton: {
    width: 36,
    height: 25,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeNumberInput: {
    width: 48,
    height: 34,
    borderRadius: 13,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 0,
  },
  timeUnitLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeColon: {
    marginTop: -15,
    fontSize: 24,
    fontWeight: '800',
  },
  colorOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
  },
  colorSelectorWrap: {
    maxWidth: 188,
    alignItems: 'flex-end',
  },
  colorButton: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDot: {
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  colorCheckBadge: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  customColorCircle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customColorPart: {
    width: '50%',
    height: '50%',
  },
  customColorPartOne: {
    backgroundColor: '#ff4f8b',
  },
  customColorPartTwo: {
    backgroundColor: '#2f7df6',
  },
  customColorPartThree: {
    backgroundColor: '#b8ef2f',
  },
  customColorPartFour: {
    backgroundColor: '#ffa43b',
  },
  expandedColorPalette: {
    width: 126,
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  paletteColorButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paletteColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  repeatCard: {
    marginTop: 12,
    borderRadius: 21,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
  },
  repeatHeaderRow: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repeatValue: {
    color: accent,
    fontSize: 17,
    fontWeight: '500',
  },
  repeatOptions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  repeatOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatOptionButton: {
    minWidth: 70,
    height: 33,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOptionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  weekdayChips: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
  },
  weekdayChip: {
    flex: 1,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  deleteSection: {
    marginTop: 11,
  },
  deleteButton: {
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#ff5d5d',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteCancelButton: {
    flex: 1,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  deleteConfirmButton: {
    flex: 1.4,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,93,93,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,93,0.35)',
  },
  deleteConfirmText: {
    color: '#ff5d5d',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 31,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalValueBox: {
    marginTop: 20,
    minHeight: 86,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalValue: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 0,
  },
  stepSelector: {
    marginTop: 16,
    padding: 4,
    borderRadius: 18,
    flexDirection: 'row',
  },
  stepPill: {
    flex: 1,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: accent,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalControls: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 14,
  },
  adjustButton: {
    flex: 1,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonPrimary: {
    flex: 1,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accent,
  },
  doneButton: {
    height: 52,
    marginTop: 16,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accent,
  },
  doneButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  tabBar: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 18,
    height: 86,
    borderRadius: 31,
    paddingHorizontal: 18,
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 18,
  },
  darkTabBar: {},
  lightTabBar: {
    left: 28,
    right: 28,
    bottom: 18,
    height: 86,
    borderRadius: 31,
    borderTopWidth: 1,
    shadowOpacity: 0.08,
    elevation: 8,
  },
  tabBarWithQr: {
    left: 20,
    right: 20,
    paddingHorizontal: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabButtonBeforeQr: {
    marginRight: 24,
  },
  tabButtonAfterQr: {
    marginLeft: 24,
  },
  tabQrButton: {
    position: 'absolute',
    left: '50%',
    top: -20,
    width: 64,
    height: 64,
    marginLeft: -32,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 5,
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 118,
    height: 5,
    marginLeft: -59,
    borderRadius: 3,
  },
});
