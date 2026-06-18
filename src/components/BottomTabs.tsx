import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/styles';
import { accent } from '../constants/colors';
import { tabs } from '../constants/tabs';
import type { TabKey, Theme } from '../types';

export function BottomTabs({
  activeTab,
  onChange,
  activeTheme,
  onQrPress,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  activeTheme: Theme;
  onQrPress: () => void;
}) {
  const dark = activeTheme.mode === 'dark';
  const showQrButton = activeTab === 'Nutrition';

  return (
    <View
      style={[
        styles.tabBar,
        dark ? styles.darkTabBar : styles.lightTabBar,
        showQrButton && styles.tabBarWithQr,
        {
          backgroundColor: activeTheme.tabBg,
          borderTopColor: activeTheme.divider,
          shadowColor: activeTheme.shadowColor,
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const active = tab.key === activeTab;
        const color = active ? accent : activeTheme.tabMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.76}
            style={[
              styles.tabButton,
              showQrButton && index === 1 && styles.tabButtonBeforeQr,
              showQrButton && index === 2 && styles.tabButtonAfterQr,
            ]}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={25}
              color={color}
              style={
                active
                  ? {
                      textShadowColor: accent,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: activeTheme.mode === 'dark' ? 3 : 2,
                    }
                  : undefined
              }
            />
            <Text style={[styles.tabText, { color: active ? accent : activeTheme.tabText }]}>{tab.key}</Text>
          </TouchableOpacity>
        );
      })}
      {showQrButton && (
        <View pointerEvents="box-none" style={styles.tabQrCenterWrap}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onQrPress}
            style={[
              styles.tabQrButton,
              {
                backgroundColor: dark ? 'rgba(31,33,35,0.94)' : 'rgba(255,255,255,0.96)',
                borderColor: accent,
                shadowColor: accent,
                shadowOpacity: dark ? 0.5 : 0.24,
              },
            ]}
          >
            <Ionicons name="qr-code-outline" size={28} color={dark ? '#ffffff' : '#111111'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
