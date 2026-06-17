export const formatCalories = (value: number) => value.toLocaleString('en-US');
export const formatHydration = (ml: number) => `${(ml / 1000).toFixed(1)} L`;
export const formatSleep = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
};
export const getSleepColor = (minutes: number) => {
  if (minutes < 300) {
    return '#7f1d1d';
  }

  if (minutes < 360) {
    return '#ef4444';
  }

  if (minutes < 420) {
    return '#f59e0b';
  }

  if (minutes < 450) {
    return '#d9e64c';
  }

  if (minutes < 480) {
    return '#9ee23a';
  }

  if (minutes <= 510) {
    return '#22c55e';
  }

  if (minutes > 540) {
    return '#65a847';
  }

  return '#35c85a';
};
export const getHydrationColor = (ml: number) => {
  if (ml <= 500) {
    return '#991b1b';
  }

  if (ml < 1500) {
    return '#f97316';
  }

  if (ml < 2500) {
    return '#b8ef2f';
  }

  if (ml < 3000) {
    return '#65c832';
  }

  return '#16a34a';
};
export const getCaloriesColor = (calorieValue: number, calorieGoal: number) => {
  const target = Math.max(calorieGoal, 1);
  const ratio = calorieValue / target;

  if (ratio < 0.25) {
    return '#c65f54';
  }

  if (ratio < 0.5) {
    return '#f97316';
  }

  if (ratio < 0.75) {
    return '#facc15';
  }

  if (ratio <= 1.05) {
    return '#22c55e';
  }

  if (ratio <= 1.22) {
    return '#facc15';
  }

  if (ratio <= 1.45) {
    return '#d97706';
  }

  return '#9f3f46';
};
export const getProductivityLeftColor = (progress: number) => {
  if (progress >= 0.65) {
    return '#22c55e';
  }

  if (progress >= 0.35) {
    return '#facc15';
  }

  if (progress >= 0.18) {
    return '#f97316';
  }

  return '#dc2626';
};
export const hexToRgba = (hex: string, alpha: number) => {
  const normalizedHex = hex.replace('#', '');
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
};
