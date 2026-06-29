import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [aiCoachVisible, setAiCoachVisible] = useState(false);
  const [aiCoachPrompt, setAiCoachPrompt] = useState('');
  const [aiCoachMessages, setAiCoachMessages] = useState<string[]>([]);
  const nextActivities = getRemainingTodayActivities(activities, 3);
  const hasRemainingActivities = nextActivities.length > 0;

  const ACTIVITY_GRADIENT_ANGLE = 135; 
  const activityGradientCoords = getGradientCoordinates(ACTIVITY_GRADIENT_ANGLE);

  const STATS_GRADIENT_ANGLE = 230; 
  const statsGradientCoords = getGradientCoordinates(STATS_GRADIENT_ANGLE);

  const handleOpenAICoach = () => {
    setAiCoachVisible(true);
  };

  const handleSendAICoachMessage = () => {
    const message = aiCoachPrompt.trim();

    if (!message) {
      return;
    }

    setAiCoachMessages((current) => [...current, message]);
    setAiCoachPrompt('');
  };

  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.52, 1]} style={styles.homeContent}>
      <View style={[styles.screenHeaderRow, styles.homeHeader]}>
        <View style={styles.homeTitleBlock}>
          <Text style={[styles.homePageTitle, { color: activeTheme.titleText }]}>Today</Text>
        </View>

        <View style={[styles.screenHeaderActions, styles.homeHeaderActions]}>
          <Pressable
            onPress={handleOpenAICoach}
            hitSlop={16}
            style={({ pressed }) => [
              styles.homeActionButton,
              pressed && styles.homeActionButtonPressed,
              {
                backgroundColor: activeTheme.iconButtonBg,
                borderColor: activeTheme.iconButtonBorder,
              },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={activeTheme.iconButtonColor} />
          </Pressable>
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

      <Modal
        transparent
        visible={aiCoachVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setAiCoachVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.aiCoachModalOverlay, { backgroundColor: activeTheme.modalOverlay }]}
        >
          <LinearGradient
            colors={
              activeTheme.mode === 'dark'
                ? ['rgba(9,10,10,0.98)', 'rgba(20,25,18,0.97)', 'rgba(7,8,8,0.98)']
                : ['rgba(24,27,24,0.98)', 'rgba(34,43,27,0.96)', 'rgba(16,18,17,0.98)']
            }
            locations={[0, 0.54, 1]}
            style={[styles.aiCoachSheet, { borderColor: activeTheme.mode === 'dark' ? 'rgba(184,239,47,0.18)' : 'rgba(184,239,47,0.22)' }]}
          >
            <View style={[styles.aiCoachHandle, { backgroundColor: activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.34)' }]} />

            <View style={styles.aiCoachHeader}>
              <View style={styles.aiCoachTitleRow}>
                <View style={styles.aiCoachLogo}>
                  <Ionicons name="sparkles" size={23} color={accent} />
                </View>
                <View style={styles.aiCoachTitleBlock}>
                  <Text style={styles.aiCoachTitle}>AI Coach</Text>
                  <Text style={styles.aiCoachSubtitle}>Fitness, habits, and productivity.</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.78} onPress={() => setAiCoachVisible(false)} style={styles.aiCoachCloseButton}>
                <Ionicons name="close" size={22} color="#f4f7ef" />
              </TouchableOpacity>
            </View>

            <View style={styles.aiCoachConversation}>
              <View style={styles.aiCoachMessageRow}>
                <View style={styles.aiCoachAvatar}>
                  <Ionicons name="sparkles" size={16} color={accent} />
                </View>
                <View style={styles.aiCoachBubble}>
                  <Text style={styles.aiCoachBubbleText}>What do you want to improve today?</Text>
                </View>
              </View>

              {aiCoachMessages.map((message, index) => (
                <View key={`${message}-${index}`} style={styles.aiCoachUserMessage}>
                  <Text style={styles.aiCoachUserMessageText}>{message}</Text>
                </View>
              ))}

              <View style={styles.aiCoachChipRow}>
                {['Plan my day', 'Review habits', 'Fitness advice', 'Nutrition check'].map((chip) => (
                  <TouchableOpacity key={chip} activeOpacity={0.78} onPress={() => setAiCoachPrompt(chip)} style={styles.aiCoachPromptChip}>
                    <Text style={styles.aiCoachPromptChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.aiCoachInputDock}>
              <View style={styles.aiCoachInputBox}>
                <TextInput
                  value={aiCoachPrompt}
                  onChangeText={setAiCoachPrompt}
                  placeholder="Ask about fitness or productivity..."
                  placeholderTextColor="rgba(244,247,239,0.48)"
                  style={styles.aiCoachInput}
                />
                <TouchableOpacity activeOpacity={0.82} onPress={handleSendAICoachMessage} style={styles.aiCoachSendButton}>
                  <Ionicons name="send" size={16} color="#151713" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.82} style={styles.aiCoachMicButton}>
                <Ionicons name="mic-outline" size={20} color={accent} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}
