import { statusBad, statusGood, statusWarning } from '../constants/colors';

export type GoalStatusMode = 'balanced';

export const formatCalories = (value: number) => value.toLocaleString('en-US');
export const formatHydration = (ml: number) => `${(ml / 1000).toFixed(1)} L`;
export const formatSleep = (minutes: number) => {
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
export const getGoalStatusColor = (value: number, goal: number, mode: GoalStatusMode = 'balanced') => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeGoal = Number.isFinite(goal) ? Math.max(goal, 1) : 1;
  const ratio = safeValue / safeGoal;

  if (mode === 'balanced' && ratio < 0.65) {
    return statusBad;
  }

  if (mode === 'balanced' && ratio < 0.85) {
    return statusWarning;
  }

  if (mode === 'balanced' && ratio <= 1.08) {
    return statusGood;
  }

  if (mode === 'balanced' && ratio <= 1.25) {
    return statusWarning;
  }

  return statusBad;
};
export const getSleepColor = (minutes: number) => {
  return getGoalStatusColor(minutes, 480);
};
export const getHydrationColor = (ml: number) => {
  return getGoalStatusColor(ml, 2500);
};
export const getCaloriesColor = (calorieValue: number, calorieGoal: number) => {
  return getGoalStatusColor(calorieValue, calorieGoal);
};
export const getProductivityLeftColor = (progress: number) => {
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
export const hexToRgba = (hex: string, alpha: number) => {
  const normalizedHex = hex.replace('#', '');
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
};
