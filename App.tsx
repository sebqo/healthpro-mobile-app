import { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { BottomTabs } from './src/components/BottomTabs';
import { initialActivities, initialMeals } from './src/constants/initialData';
import { darkTheme, lightTheme } from './src/constants/theme';
import { ActivityEditorModal } from './src/modals/ActivityEditorModal';
import { MealEditorModal } from './src/modals/MealEditorModal';
import { ScannerPlaceholderModal } from './src/modals/ScannerPlaceholderModal';
import { StatEditorModal } from './src/modals/StatEditorModal';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { styles } from './src/styles/styles';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, EditableStatKey, Meal, MealModalMode, MealSource, SleepStep, Stat, TabKey } from './src/types';
import { createDraftActivity, normalizeActivityDraft } from './src/utils/activities';
import { getMonthStartISO, getTodayISO } from './src/utils/date';
import { createDraftMeal } from './src/utils/nutrition';
import { formatCalories, formatHydration, formatSleep, getCaloriesColor, getHydrationColor, getProductivityLeftColor, getSleepColor } from './src/utils/formatting';
import { formatTimeFromMinutes, getCurrentLocalMinutes, safeParseMinutes } from './src/utils/time';

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
