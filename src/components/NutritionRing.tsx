import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { styles } from '../styles/styles';
import type { IconName, Theme } from '../types';
import { MacroGlyph } from './MacroGlyph';

export function NutritionRing({
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
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const clampedProgress = Math.min(Math.max(safeProgress, 0), 1);
  const strokeWidth = Math.max(8, Math.round(size * 0.1));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const trackColor = activeTheme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,17,0.06)';

  return (
    <View
      style={[
        styles.nutritionRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={center}
          originY={center}
        />
      </Svg>
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
