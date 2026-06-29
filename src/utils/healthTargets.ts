import { statusBad, statusGood, statusWarning } from '../constants/colors';
import type {
  ActivityLevel,
  CalculatedNutritionTargets,
  HealthGoalType,
  UserGoalProfile,
  UserHealthProfile,
} from '../types';

export type TargetStatus = 'bad' | 'warning' | 'good';

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const calorieMultipliers: Record<HealthGoalType, number> = {
  lose_weight: 0.85,
  lose_fat_aggressive: 0.78,
  gain_weight: 1.1,
  gain_muscle: 1.08,
  body_recomposition: 0.98,
};

const proteinGramsPerKg: Record<HealthGoalType, number> = {
  lose_weight: 1.8,
  lose_fat_aggressive: 2,
  gain_weight: 1.6,
  gain_muscle: 1.9,
  body_recomposition: 1.8,
};

const sanitizePositiveNumber = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
};

const sanitizeProfile = (profile: UserHealthProfile): UserHealthProfile => ({
  weightKg: sanitizePositiveNumber(profile.weightKg, 70),
  heightCm: sanitizePositiveNumber(profile.heightCm, 170),
  age: sanitizePositiveNumber(profile.age, 30),
  sex: profile.sex === 'female' ? 'female' : 'male',
});

export const calculateBMI = (profile: UserHealthProfile) => {
  const safeProfile = sanitizeProfile(profile);
  const heightM = safeProfile.heightCm / 100;

  return Math.round((safeProfile.weightKg / (heightM * heightM)) * 10) / 10;
};

export const calculateBMR = (profile: UserHealthProfile) => {
  const safeProfile = sanitizeProfile(profile);
  const baseBmr = 10 * safeProfile.weightKg + 6.25 * safeProfile.heightCm - 5 * safeProfile.age;

  return Math.round(safeProfile.sex === 'male' ? baseBmr + 5 : baseBmr - 161);
};

export const calculateTDEE = (profile: UserHealthProfile, goalProfile: UserGoalProfile) => {
  const bmr = calculateBMR(profile);
  const multiplier = activityMultipliers[goalProfile.activityLevel] ?? activityMultipliers.moderate;

  return Math.round(bmr * multiplier);
};

export const getTargetStatus = (value: number, target: number): TargetStatus => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeTarget = Number.isFinite(target) ? Math.max(target, 1) : 1;
  const ratio = safeValue / safeTarget;

  if (ratio < 0.65) {
    return 'bad';
  }

  if (ratio < 0.85) {
    return 'warning';
  }

  if (ratio <= 1.08) {
    return 'good';
  }

  if (ratio <= 1.25) {
    return 'warning';
  }

  return 'bad';
};

export const getTargetStatusColor = (value: number, target: number) => {
  const status = getTargetStatus(value, target);

  if (status === 'good') {
    return statusGood;
  }

  if (status === 'warning') {
    return statusWarning;
  }

  return statusBad;
};

export const getGoalCompletionRatio = (value: number, target: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }

  const ratio = Math.max(0, value) / target;
  return Math.min(Math.max(ratio, 0), 1);
};

export const calculateNutritionTargets = (
  profile: UserHealthProfile,
  goalProfile: UserGoalProfile,
): CalculatedNutritionTargets => {
  const safeProfile = sanitizeProfile(profile);
  const bmr = calculateBMR(safeProfile);
  const tdee = calculateTDEE(safeProfile, goalProfile);
  const calorieMultiplier = calorieMultipliers[goalProfile.goalType] ?? calorieMultipliers.body_recomposition;
  const minimumCalories = safeProfile.sex === 'female' ? 1200 : 1500;
  const calories = Math.round(Math.max(tdee * calorieMultiplier, minimumCalories));
  const protein = Math.round(safeProfile.weightKg * (proteinGramsPerKg[goalProfile.goalType] ?? 1.8));
  const fat = Math.round((calories * 0.28) / 9);
  const remainingCalories = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = Math.round(remainingCalories / 4);

  return {
    calories,
    protein,
    carbs,
    fat,
    bmr,
    tdee,
    bmi: calculateBMI(safeProfile),
  };
};
