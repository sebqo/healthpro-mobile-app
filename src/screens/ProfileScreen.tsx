import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ReactNode } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { accent } from '../constants/colors';
import { styles } from '../styles/styles';
import type { ActivityLevel, CalculatedNutritionTargets, HealthGoalType, Theme, UserGoalProfile, UserHealthProfile, UserSex } from '../types';

const goalOptions: Array<{ label: string; value: HealthGoalType }> = [
  { label: 'Losing weight', value: 'lose_weight' },
  { label: 'Gaining weight', value: 'gain_weight' },
  { label: 'Gaining muscles', value: 'gain_muscle' },
  { label: 'Losing fat aggressively', value: 'lose_fat_aggressive' },
  { label: 'Body recomposition', value: 'body_recomposition' },
];
const activityLevels: Array<{ label: string; value: ActivityLevel }> = [
  { label: 'Sedentary', value: 'sedentary' },
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Active', value: 'active' },
  { label: 'Very active', value: 'very_active' },
];
const activeDayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ProfileScreen({
  activeTheme,
  isDarkMode,
  healthProfile,
  goalProfile,
  calculatedTargets,
  onChangeHealthProfile,
  onChangeGoalProfile,
  onToggleTheme,
}: {
  activeTheme: Theme;
  isDarkMode: boolean;
  healthProfile: UserHealthProfile;
  goalProfile: UserGoalProfile;
  calculatedTargets: CalculatedNutritionTargets;
  onChangeHealthProfile: (updates: Partial<UserHealthProfile>) => void;
  onChangeGoalProfile: (updates: Partial<UserGoalProfile>) => void;
  onToggleTheme: () => void;
}) {
  const [weightText, setWeightText] = useState(String(healthProfile.weightKg));
  const [heightText, setHeightText] = useState(String(healthProfile.heightCm));
  const [ageText, setAgeText] = useState(String(healthProfile.age));
  const [targetWeightText, setTargetWeightText] = useState(String(goalProfile.targetWeightKg));
  const [activeDays, setActiveDays] = useState<string[]>(activeDayOptions.slice(0, goalProfile.activeDaysPerWeek));
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const glassCardBg = activeTheme.mode === 'dark' ? 'rgba(80,77,77,0.12)' : 'rgba(255,255,255,0.72)';
  const glassCardEnd = activeTheme.mode === 'dark' ? 'rgba(60,73,30,0.3)' : 'rgba(255,255,255,0.45)';
  const cardBorder = activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.055)';

  useEffect(() => setWeightText(String(healthProfile.weightKg)), [healthProfile.weightKg]);
  useEffect(() => setHeightText(String(healthProfile.heightCm)), [healthProfile.heightCm]);
  useEffect(() => setAgeText(String(healthProfile.age)), [healthProfile.age]);
  useEffect(() => setTargetWeightText(String(goalProfile.targetWeightKg)), [goalProfile.targetWeightKg]);
  const parseProfileNumber = (value: string) => {
    if (value.trim() === '') {
      return null;
    }

    const parsedValue = Number(value.replace(',', '.'));
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  };

  const updateNumericText = (
    value: string,
    setValue: (value: string) => void,
    onValidValue: (value: number) => void,
  ) => {
    setValue(value);
    const parsedValue = parseProfileNumber(value);

    if (parsedValue !== null) {
      onValidValue(parsedValue);
    }
  };

  const renderOptionCard = ({
    icon,
    title,
    subtitle,
    trailing,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    trailing?: ReactNode;
  }) => (
    <LinearGradient
      colors={[glassCardBg, glassCardEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.profileOptionCard,
        {
          borderColor: cardBorder,
          shadowColor: activeTheme.shadowColor,
        },
      ]}
    >
      <View style={[styles.profileOptionIcon, { backgroundColor: activeTheme.statIconBg }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View style={styles.profileOptionText}>
        <Text style={[styles.profileOptionTitle, { color: activeTheme.titleText }]}>{title}</Text>
        <Text style={[styles.profileOptionSubtitle, { color: activeTheme.mutedText }]}>{subtitle}</Text>
      </View>
      {trailing ?? <Ionicons name="chevron-forward" size={19} color={activeTheme.mutedText} />}
    </LinearGradient>
  );

  const renderInputRow = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    suffix?: string,
  ) => (
    <View style={[styles.profileInputRow, { borderColor: activeTheme.divider }]}>
      <Text style={[styles.profileInputLabel, { color: activeTheme.secondaryText }]}>{label}</Text>
      <View style={styles.profileInputValueRow}>
        <TextInput
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={activeTheme.mutedText}
          style={[styles.profileInput, { color: activeTheme.titleText }]}
        />
        {suffix ? <Text style={[styles.profileInputSuffix, { color: activeTheme.mutedText }]}>{suffix}</Text> : null}
      </View>
    </View>
  );

  const renderChip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.profileChip,
        {
          backgroundColor: active ? accent : activeTheme.modalControlBg,
          borderColor: active ? accent : activeTheme.cardBorder,
        },
        active && styles.profileChipActive,
      ]}
    >
      <Text style={[styles.profileChipText, { color: active ? '#111111' : activeTheme.secondaryText }]}>{label}</Text>
    </TouchableOpacity>
  );

  const toggleActiveDay = (day: string) => {
    setActiveDays((currentDays) => {
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day];
      onChangeGoalProfile({ activeDaysPerWeek: Math.min(Math.max(nextDays.length, 0), 7) });

      return nextDays;
    });
  };

  return (
    <LinearGradient colors={activeTheme.homeGradient} locations={[0, 0.52, 1]} style={styles.profileContent}>
      <View style={[styles.screenHeaderRow, styles.profileHeader]}>
        <Text style={[styles.profileTitle, { color: activeTheme.titleText }]}>Profile</Text>
        <View style={[styles.topActionNeutralButton, styles.profileAvatar, { backgroundColor: activeTheme.statIconBg }]}>
          <Ionicons name="person" size={34} color={accent} />
        </View>
      </View>

      <ScrollView
        style={styles.profileScroll}
        contentContainerStyle={styles.profileScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[glassCardBg, glassCardEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.profileCard,
            {
              borderColor: cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <View>
            <Text style={[styles.profileName, { color: activeTheme.titleText }]}>Simon Spielberg</Text>
            <Text style={[styles.profileMeta, { color: activeTheme.mutedText }]}>HealthPro prototype</Text>
          </View>
          <View style={[styles.profileHeaderBadge, { backgroundColor: activeTheme.statIconBg }]}>
            <Ionicons name="sparkles" size={17} color={accent} />
          </View>
        </LinearGradient>

        <View style={styles.profileOptionStack}>
          {renderOptionCard({
            icon: 'person-circle-outline',
            title: 'Account',
            subtitle: 'Identity, preferences, and connected data',
          })}
          {renderOptionCard({
            icon: 'contrast-outline',
            title: 'Appearance',
            subtitle: isDarkMode ? 'Dark mode' : 'Light mode',
            trailing: <ThemeToggle activeTheme={activeTheme} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />,
          })}
        </View>

        <LinearGradient
          colors={[glassCardBg, glassCardEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.profileSectionCard,
            {
              borderColor: cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setPersonalInfoExpanded((value) => !value)}
            style={styles.profileCardHeader}
          >
            <View>
              <Text style={[styles.profileSectionTitle, { color: activeTheme.titleText }]}>Personal info</Text>
              <Text style={[styles.profileSectionSubtitle, { color: activeTheme.mutedText }]}>Used later for smarter targets</Text>
            </View>
            <View style={styles.profileHeaderIconRow}>
              <Ionicons name="body-outline" size={20} color={accent} />
              <Ionicons name={personalInfoExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={activeTheme.mutedText} />
            </View>
          </TouchableOpacity>

          {personalInfoExpanded ? (
            <>
              {renderInputRow('Weight', weightText, (value) => updateNumericText(value, setWeightText, (weightKg) => onChangeHealthProfile({ weightKg })), 'kg')}
              {renderInputRow('Height', heightText, (value) => updateNumericText(value, setHeightText, (heightCm) => onChangeHealthProfile({ heightCm })), 'cm')}
              <View style={[styles.profileInputRow, { borderColor: activeTheme.divider }]}>
                <Text style={[styles.profileInputLabel, { color: activeTheme.secondaryText }]}>Sex</Text>
                <View style={styles.profileMiniChipRow}>
                  {(['male', 'female'] as UserSex[]).map((option) =>
                    renderChip(option === 'male' ? 'Male' : 'Female', healthProfile.sex === option, () =>
                      onChangeHealthProfile({ sex: option }),
                    ),
                  )}
                </View>
              </View>
              {renderInputRow('Age', ageText, (value) =>
                updateNumericText(value, setAgeText, (age) => onChangeHealthProfile({ age: Math.round(age) })),
              )}
            </>
          ) : null}
        </LinearGradient>

        <LinearGradient
          colors={[glassCardBg, glassCardEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.profileSectionCard,
            {
              borderColor: cardBorder,
              shadowColor: activeTheme.shadowColor,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setGoalsExpanded((value) => !value)}
            style={styles.profileCardHeader}
          >
            <View>
              <Text style={[styles.profileSectionTitle, { color: activeTheme.titleText }]}>Goals</Text>
              <Text style={[styles.profileSectionSubtitle, { color: activeTheme.mutedText }]}>Local only for now</Text>
            </View>
            <View style={styles.profileHeaderIconRow}>
              <Ionicons name="flag-outline" size={20} color={accent} />
              <Ionicons name={goalsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={activeTheme.mutedText} />
            </View>
          </TouchableOpacity>

          {goalsExpanded ? (
            <>
              {renderInputRow('Target weight', targetWeightText, (value) =>
                updateNumericText(value, setTargetWeightText, (targetWeightKg) => onChangeGoalProfile({ targetWeightKg })),
              'kg')}

              <Text style={[styles.profileFieldCaption, { color: activeTheme.secondaryText }]}>Main goal</Text>
              <View style={styles.profileChipRow}>
                {goalOptions.map((goal) =>
                  renderChip(goal.label, goalProfile.goalType === goal.value, () => onChangeGoalProfile({ goalType: goal.value })),
                )}
              </View>

              <Text style={[styles.profileFieldCaption, { color: activeTheme.secondaryText }]}>Regular activity</Text>
              <View style={styles.profileChipRow}>
                {activityLevels.map((level) =>
                  renderChip(level.label, goalProfile.activityLevel === level.value, () =>
                    onChangeGoalProfile({ activityLevel: level.value }),
                  ),
                )}
              </View>

              <Text style={[styles.profileFieldCaption, { color: activeTheme.secondaryText }]}>Activities</Text>
              <TextInput
                value={goalProfile.activityListText}
                onChangeText={(activityListText) => onChangeGoalProfile({ activityListText })}
                placeholder="gym, running, football"
                placeholderTextColor={activeTheme.mutedText}
                style={[
                  styles.profileActivitiesInput,
                  {
                    color: activeTheme.titleText,
                    backgroundColor: activeTheme.modalControlBg,
                    borderColor: activeTheme.cardBorder,
                  },
                ]}
              />

              <Text style={[styles.profileFieldCaption, { color: activeTheme.secondaryText }]}>Active days per week</Text>
              <View style={styles.profileDayChipRow}>
                {activeDayOptions.map((day) => renderChip(day, activeDays.includes(day), () => toggleActiveDay(day)))}
              </View>

              <View style={[styles.profileTargetSummary, { backgroundColor: activeTheme.modalControlBg, borderColor: activeTheme.cardBorder }]}>
                <Text style={[styles.profileTargetSummaryTitle, { color: activeTheme.titleText }]}>Estimated targets</Text>
                <View style={styles.profileTargetSummaryGrid}>
                  <Text style={[styles.profileTargetSummaryText, { color: activeTheme.secondaryText }]}>
                    Calories <Text style={[styles.profileTargetSummaryValue, { color: accent }]}>{calculatedTargets.calories}</Text>
                  </Text>
                  <Text style={[styles.profileTargetSummaryText, { color: activeTheme.secondaryText }]}>
                    Protein <Text style={[styles.profileTargetSummaryValue, { color: accent }]}>{calculatedTargets.protein}g</Text>
                  </Text>
                  <Text style={[styles.profileTargetSummaryText, { color: activeTheme.secondaryText }]}>
                    Carbs <Text style={[styles.profileTargetSummaryValue, { color: accent }]}>{calculatedTargets.carbs}g</Text>
                  </Text>
                  <Text style={[styles.profileTargetSummaryText, { color: activeTheme.secondaryText }]}>
                    Fat <Text style={[styles.profileTargetSummaryValue, { color: accent }]}>{calculatedTargets.fat}g</Text>
                  </Text>
                  <Text style={[styles.profileTargetSummaryText, { color: activeTheme.secondaryText }]}>
                    BMI <Text style={[styles.profileTargetSummaryValue, { color: accent }]}>{calculatedTargets.bmi}</Text>
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}
