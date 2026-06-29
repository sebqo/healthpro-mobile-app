import type { NutritionTotals, UserGoalProfile, UserHealthProfile } from '../types';

export const nutritionGoals: NutritionTotals = {
  calories: 3000,
  protein: 160,
  carbs: 300,
  fat: 70,
};

export const defaultHealthProfile: UserHealthProfile = {
  weightKg: 82,
  heightCm: 181,
  age: 29,
  sex: 'male',
};

export const defaultGoalProfile: UserGoalProfile = {
  targetWeightKg: 78,
  goalType: 'body_recomposition',
  activityLevel: 'moderate',
  activeDaysPerWeek: 3,
  activityListText: '',
};
