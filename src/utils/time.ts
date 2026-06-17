import { pad2 } from './date';

export const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};
export const safeParseMinutes = (time: string, fallback: number) => {
  const [hoursText, minutesText] = time.split(':');
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return fallback;
  }

  return Math.min(Math.max(hours, 0), 23) * 60 + Math.min(Math.max(minutes, 0), 59);
};
export const clampMinutes = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};
export const getCurrentLocalMinutes = () => {
  const now = new Date();

  return now.getHours() * 60 + now.getMinutes();
};
export const getCurrentTimeHHMM = () => {
  const now = new Date();

  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};
export const normalizeTimePart = (value: string, max: number) => {
  const numberValue = Number.parseInt(value.replace(/\D/g, ''), 10);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return Math.min(Math.max(numberValue, 0), max);
};
export const buildTime = (hours: number, minutes: number) => `${pad2(hours)}:${pad2(minutes)}`;
export const getTimeParts = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return {
    hours: Number.isFinite(hours) ? Math.min(Math.max(hours, 0), 23) : 0,
    minutes: Number.isFinite(minutes) ? Math.min(Math.max(minutes, 0), 59) : 0,
  };
};
export const formatTimeFromMinutes = (minutes: number) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
export const adjustTime = (time: string, minutes: number) => formatTimeFromMinutes(parseTimeToMinutes(time) + minutes);
export const formatMealTime = (time: string) => {
  const minutes = safeParseMinutes(time, 0);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${pad2(mins)} ${period}`;
};
