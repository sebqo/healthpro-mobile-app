import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type TabKey = 'Home' | 'Activity' | 'Nutrition' | 'Profile';
export type EditableStatKey = 'Sleep' | 'Hydration' | 'Calories';
export type SleepStep = 15 | 60;
export type CalorieStep = 10 | 100;
export type ActivityViewMode = 'month' | 'week';
export type IconName = ComponentProps<typeof Ionicons>['name'];
export type RepeatOption = 'none' | 'daily' | 'weekly' | 'custom';
export type Stat = {
  label: 'Sleep' | 'Prod. Left' | 'Hydration' | 'Calories';
  value: string;
  icon: IconName;
  progress: number;
  editable?: boolean;
  accentColor?: string;
};
export type Activity = {
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
export type ActivityDraft = Activity;
export type ActivityModalMode = 'new' | 'edit';
export type MealModalMode = 'new' | 'edit';
export type EditingTimeTarget = 'start' | 'end' | null;
export type EditingDateTarget = 'start' | 'end' | null;
export type MealSource = 'manual' | 'scan';
export type Meal = {
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
export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type UserSex = 'male' | 'female';
export type HealthGoalType =
  | 'lose_weight'
  | 'gain_weight'
  | 'gain_muscle'
  | 'lose_fat_aggressive'
  | 'body_recomposition';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type UserHealthProfile = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: UserSex;
};
export type UserGoalProfile = {
  targetWeightKg: number;
  goalType: HealthGoalType;
  activityLevel: ActivityLevel;
  activeDaysPerWeek: number;
  activityListText: string;
};
export type CalculatedNutritionTargets = NutritionTotals & {
  bmr: number;
  tdee: number;
  bmi: number;
};
export type TimelineItem = {
  activity: Activity;
  visualStart: number;
  visualEnd: number;
  left: number;
  width: number;
  top: number;
  lane: number;
};
export type CalendarDay = {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  isSelected: boolean;
};
export type Theme = {
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
