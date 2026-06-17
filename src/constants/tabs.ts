import type { IconName, TabKey } from '../types';

export const tabs: Array<{ key: TabKey; icon: IconName; activeIcon: IconName }> = [
  { key: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Activity', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { key: 'Nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { key: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];
