import type { Meal, NutritionTotals } from '../types';
import { addDays } from './date';
import { getCurrentTimeHHMM, parseTimeToMinutes } from './time';

export const getMealsForDate = (meals: Meal[], date: string) =>
  meals
    .filter((meal) => meal.date === date)
    .sort((firstMeal, secondMeal) => parseTimeToMinutes(secondMeal.time) - parseTimeToMinutes(firstMeal.time));
export const getNutritionTotals = (mealsForDate: Meal[]): NutritionTotals =>
  mealsForDate.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
export const hasMealsForDate = (meals: Meal[], date: string) => meals.some((meal) => meal.date === date);
export const getMealStreak = (meals: Meal[], today: string) => {
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    if (!hasMealsForDate(meals, addDays(today, -offset))) {
      break;
    }

    streak += 1;
  }

  return streak;
};
export const createDraftMeal = (date: string): Meal => {
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
export const clampMacroInput = (value: string) => {
  const parsedValue = Number.parseInt(value.replace(/\D/g, ''), 10);

  return Number.isNaN(parsedValue) ? 0 : Math.max(0, parsedValue);
};
