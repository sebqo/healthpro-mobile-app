import type { CalendarDay } from '../types';
import { NUTRITION_DATE_WINDOW_SIZE } from '../constants/layout';

export const pad2 = (value: number) => String(value).padStart(2, '0');
export const toLocalISODate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
export const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
};
export const getTodayISO = () => toLocalISODate(new Date());
export const isToday = (dateString: string) => dateString === getTodayISO();
export const addDays = (dateString: string, days: number) => {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);

  return toLocalISODate(date);
};
export const addMonths = (dateString: string, months: number) => {
  const date = parseLocalDate(dateString);
  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  return toLocalISODate(date);
};
export const getMonthTitle = (dateString: string) => {
  const date = parseLocalDate(dateString);
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};
export const getAgendaTitle = (dateString: string) => {
  const today = getTodayISO();
  const tomorrow = addDays(today, 1);
  const date = parseLocalDate(dateString);
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dateLabel = `${weekdayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;

  if (dateString === today) {
    return `Today \u2022 ${dateLabel}`;
  }

  if (dateString === tomorrow) {
    return `Tomorrow \u2022 ${dateLabel}`;
  }

  return dateLabel;
};
export const getMondayWeekdayIndex = (dateString: string) => {
  const date = parseLocalDate(dateString);

  return (date.getDay() + 6) % 7;
};
export const getDateDistance = (startDate: string, endDate: string) => {
  const start = parseLocalDate(startDate).getTime();
  const end = parseLocalDate(endDate).getTime();

  return Math.round((end - start) / 86400000);
};
export const getMonthStartISO = (dateString: string) => {
  const date = parseLocalDate(dateString);

  return toLocalISODate(new Date(date.getFullYear(), date.getMonth(), 1));
};
export const getWeekStartISO = (dateString: string) => {
  const date = parseLocalDate(dateString);
  const mondayIndex = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayIndex);

  return toLocalISODate(date);
};
export const getWeekDays = (dateString: string): CalendarDay[] => {
  const weekStart = getWeekStartISO(dateString);

  return Array.from({ length: 7 }, (_, index) => {
    const date = parseLocalDate(addDays(weekStart, index));
    const dateStringForDay = toLocalISODate(date);

    return {
      dateString: dateStringForDay,
      dayNumber: date.getDate(),
      isCurrentMonth: true,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: isToday(dateStringForDay),
      isSelected: dateStringForDay === dateString,
    };
  });
};
export const getNutritionRangeStart = () => addDays(getTodayISO(), -365);
export const getNutritionRangeEnd = () => addDays(getTodayISO(), 365);
export const clampNutritionDate = (dateString: string) => {
  const rangeStart = getNutritionRangeStart();
  const rangeEnd = getNutritionRangeEnd();

  if (dateString < rangeStart) {
    return rangeStart;
  }

  if (dateString > rangeEnd) {
    return rangeEnd;
  }

  return dateString;
};
export const getNutritionWindowStart = (centerDate: string) => {
  const rangeStart = getNutritionRangeStart();
  const rangeEnd = getNutritionRangeEnd();
  const latestStart = addDays(rangeEnd, -(NUTRITION_DATE_WINDOW_SIZE - 1));
  const desiredStart = addDays(clampNutritionDate(centerDate), -Math.floor(NUTRITION_DATE_WINDOW_SIZE / 2));

  if (desiredStart < rangeStart) {
    return rangeStart;
  }

  if (desiredStart > latestStart) {
    return latestStart;
  }

  return desiredStart;
};
export const getNutritionWeekDays = (windowStartDate: string, selectedNutritionDate: string) => {
  const today = getTodayISO();
  const rangeStart = addDays(today, -365);
  const rangeEnd = addDays(today, 365);
  const totalDays = Math.min(
    NUTRITION_DATE_WINDOW_SIZE,
    Math.max(0, getDateDistance(windowStartDate, rangeEnd) + 1),
  );

  return Array.from({ length: totalDays }, (_, index) => {
    const dateString = addDays(windowStartDate < rangeStart ? rangeStart : windowStartDate, index);
    const date = parseLocalDate(dateString);
    const weekdayIndex = getMondayWeekdayIndex(dateString);

    return {
      dateString,
      dayLabel: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][weekdayIndex],
      dayNumber: date.getDate(),
      isSelected: dateString === selectedNutritionDate,
      isToday: isToday(dateString),
      isWeekend: weekdayIndex >= 5,
    };
  });
};
export const getNutritionDateHeading = (dateString: string) => {
  const today = getTodayISO();

  if (dateString === today) {
    return 'Today';
  }

  if (dateString === addDays(today, -1)) {
    return 'Yesterday';
  }

  const date = parseLocalDate(dateString);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};
export const getCalendarDays = (visibleMonthDate: string, selectedDate: string): CalendarDay[] => {
  const monthDate = parseLocalDate(visibleMonthDate);
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayIndex);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateString = toLocalISODate(date);
    return {
      dateString,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: isToday(dateString),
      isSelected: dateString === selectedDate,
    };
  });
};
export const formatDateChip = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${day} ${monthNames[month - 1]} ${year}`;
};
