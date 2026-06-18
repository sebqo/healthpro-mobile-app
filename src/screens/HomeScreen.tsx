import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent, activityColorPalette, carbsColor, fatColor, proteinColor } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MAX_WEEK_ZOOM, MIN_WEEK_ZOOM, NUTRITION_DATE_CARD_WIDTH, NUTRITION_DATE_ITEM_WIDTH, NUTRITION_FIXED_HEADER_HEIGHT, TIMELINE_VIEWPORT_HEIGHT, TIMELINE_WIDTH } from '../constants/layout';
import { nutritionGoals } from '../constants/nutrition';
import type { Activity, ActivityDraft, ActivityModalMode, ActivityViewMode, CalorieStep, CalendarDay, EditableStatKey, EditingDateTarget, EditingTimeTarget, Meal, NutritionTotals, RepeatOption, SleepStep, Stat, TabKey, Theme } from '../types';
import { addDays, addMonths, formatDateChip, getAgendaTitle, getCalendarDays, getDateDistance, getMonthStartISO, getMonthTitle, getNutritionDateHeading, getNutritionWeekDays, getNutritionWindowStart, getTodayISO, getWeekDays, getWeekStartISO, isToday } from '../utils/date';
import { adjustTime, buildTime, formatMealTime, formatTimeFromMinutes, getCurrentLocalMinutes, getTimeParts, normalizeTimePart, safeParseMinutes } from '../utils/time';
import { buildTimelineItems, formatActivityTime, getActivitiesForDate, getRemainingTodayActivities, normalizeActivityDraft } from '../utils/activities';
import { clampMacroInput, getMealStreak, getMealsForDate, getNutritionTotals, hasMealsForDate } from '../utils/nutrition';
import { formatCalories, formatHydration, hexToRgba } from '../utils/formatting';

// --- Pomocná funkcia na prepočet stupňov na súradnice pre Expo Linear Gradient ---
const getGradientCoordinates = (degree: number) => {
  const rad = (degree * Math.PI) / 180;
  return {
    start: [
      0.5 - Math.sin(rad) * 0.5,
      0.5 + Math.cos(rad) * 0.5,
    ] as [number, number],
    end: [
      0.5 + Math.sin(rad) * 0.5,
      0.5 - Math.cos(rad) * 0.5,
    ] as [number, number],
  };
};

export function HomeScreen({
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

  const ACTIVITY_GRADIENT_ANGLE = 135; 
  const activityGradientCoords = getGradientCoordinates(ACTIVITY_GRADIENT_ANGLE);

  const STATS_GRADIENT_ANGLE = 230; 
  const statsGradientCoords = getGradientCoordinates(STATS_GRADIENT_ANGLE);

  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.52, 1]} style={styles.homeContent}>
      <View style={[styles.screenHeaderRow, styles.homeHeader]}>
        <View style={styles.homeTitleBlock}>
          <Text style={[styles.homePageTitle, { color: activeTheme.titleText }]}>Today</Text>
        </View>

        <View style={[styles.screenHeaderActions, styles.homeHeaderActions]}>
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
            style={styles.topActionButton}
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
                  ? ['rgba(80, 77, 77, 0.12)', 'rgba(60, 73, 30, 0.3)']
                  : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.5)']
              }
              locations={[0, 1]}
              start={activityGradientCoords.start}
              end={activityGradientCoords.end}
              style={[
                styles.homeActivityCard,
                {
                  borderColor: activeTheme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderWidth: 1,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                },
              ]}
            >
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
                  { 
                    backgroundColor: activity.color,
                    width: 4,
                    shadowColor: activity.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 12,
                    elevation: 8,
                  }
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

      {/* APLIKOVANÉ SÚRADNICE PRE TODAY'S STATS GRADIENT */}
      <LinearGradient
        colors={activeTheme.statsGradient}
        start={statsGradientCoords.start}
        end={statsGradientCoords.end}
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
                  { 
                    backgroundColor: stat.accentColor ? hexToRgba(statAccent, 0.18) : activeTheme.statIconBg,
                    shadowColor: statAccent,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.22,
                    shadowRadius: 8,
                    elevation: 6,
                  },
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
                  <View 
                    style={[
                      styles.statFill, 
                      { 
                        width: `${stat.progress * 100}%`, 
                        backgroundColor: statAccent,
                        shadowColor: statAccent, // Iba farba tieňa ostáva dynamická
                      }
                    ]} 
                  />
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
