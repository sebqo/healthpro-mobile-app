import type { Activity, ActivityDraft, TimelineItem } from '../types';
import { accent } from '../constants/colors';
import { CARD_HEIGHT, HOUR_WIDTH, LANE_GAP, MIN_ACTIVITY_WIDTH, TIMELINE_WIDTH } from '../constants/layout';
import { clampMinutes, formatTimeFromMinutes, getCurrentLocalMinutes, parseTimeToMinutes, safeParseMinutes } from './time';
import { addDays, formatDateChip, getDateDistance, getMondayWeekdayIndex, getTodayISO, pad2 } from './date';

export const getActivityRangeForDate = (activity: Activity, selectedDate: string) => {
  const startDate = activity.startDate ?? activity.date;
  const endDate = activity.endDate ?? startDate;
  const fallbackStart = 9 * 60;
  const startMinutes = safeParseMinutes(activity.startTime, fallbackStart);
  const endMinutes = safeParseMinutes(activity.endTime, startMinutes + 60);
  const isOriginalDateSpan = startDate <= selectedDate && selectedDate <= endDate && startDate !== endDate;
  let visualStart = isOriginalDateSpan && selectedDate > startDate ? 0 : startMinutes;
  let visualEnd = isOriginalDateSpan && selectedDate < endDate ? 1440 : endMinutes;

  visualStart = clampMinutes(visualStart, 0, 1440);
  visualEnd = clampMinutes(visualEnd, 0, 1440);

  if (visualEnd - visualStart < 30) {
    visualEnd = clampMinutes(visualStart + 30, 0, 1440);
  }

  if (visualEnd <= visualStart) {
    visualStart = Math.max(0, visualEnd - 30);
  }

  return { visualStart, visualEnd };
};
export const buildTimelineItems = (
  activities: Activity[],
  selectedDate: string,
  hourWidth = HOUR_WIDTH,
  timelineWidth = TIMELINE_WIDTH,
) => {
  const laneEnds: number[] = [];
  const sortedActivities = [...activities]
    .filter((activity) => !activity.allDay)
    .map((activity) => ({
      activity,
      ...getActivityRangeForDate(activity, selectedDate),
    }))
    .sort((a, b) => a.visualStart - b.visualStart || a.visualEnd - b.visualEnd);

  const items = sortedActivities.map<TimelineItem>(({ activity, visualStart, visualEnd }) => {
    const duration = Math.max(30, visualEnd - visualStart);
    const lane = laneEnds.findIndex((laneEnd) => visualStart >= laneEnd);
    const normalizedLane = lane === -1 ? laneEnds.length : lane;
    const computedLeft = (visualStart / 60) * hourWidth;
    const left = Math.min(computedLeft, timelineWidth - MIN_ACTIVITY_WIDTH);
    const width = Math.min(Math.max(MIN_ACTIVITY_WIDTH, (duration / 60) * hourWidth), timelineWidth - left);

    laneEnds[normalizedLane] = visualEnd;

    return {
      activity,
      visualStart,
      visualEnd,
      left,
      width,
      top: normalizedLane * (CARD_HEIGHT + LANE_GAP),
      lane: normalizedLane,
    };
  });

  return { items, laneCount: Math.max(laneEnds.length, 1) };
};
export const compareActivityDateTime = (a: Activity, b: Activity) => {
  const dateCompare = a.date.localeCompare(b.date);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  if (a.allDay !== b.allDay) {
    return a.allDay ? -1 : 1;
  }

  return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
};
export const activityOccursOnDate = (activity: Activity, dateString: string) => {
  const activityStartDate = activity.startDate ?? activity.date;
  const activityEndDate = activity.endDate ?? activityStartDate;
  const spanDays = Math.max(getDateDistance(activityStartDate, activityEndDate), 0);

  if (dateString < activityStartDate) {
    return false;
  }

  if (activity.repeat === 'none') {
    return activityStartDate <= dateString && dateString <= activityEndDate;
  }

  if (activity.repeat === 'daily') {
    return true;
  }

  if (activity.repeat === 'weekly') {
    const daysSinceStart = getDateDistance(activityStartDate, dateString);

    return daysSinceStart >= 0 && daysSinceStart % 7 <= spanDays;
  }

  if (activity.repeat === 'custom') {
    const selectedWeekdays =
      activity.customWeekdays && activity.customWeekdays.length > 0
        ? activity.customWeekdays
        : [getMondayWeekdayIndex(activityStartDate)];

    return Array.from({ length: spanDays + 1 }, (_, offset) => addDays(dateString, -offset)).some(
      (occurrenceStartDate) =>
        occurrenceStartDate >= activityStartDate &&
        selectedWeekdays.includes(getMondayWeekdayIndex(occurrenceStartDate)),
    );
  }

  return activityStartDate <= dateString && dateString <= activityEndDate;
};
export const getActivitiesForDate = (activities: Activity[], dateString: string) =>
  activities.filter((activity) => activityOccursOnDate(activity, dateString)).sort(compareActivityDateTime);
export const getRemainingTodayActivities = (activities: Activity[], limit: number) => {
  const today = getTodayISO();
  const nowMinutes = getCurrentLocalMinutes();

  return getActivitiesForDate(activities, today)
    .filter((activity) => {
      const startDate = activity.startDate ?? activity.date;
      const endDate = activity.endDate ?? startDate;

      return activity.allDay || today < endDate || parseTimeToMinutes(activity.endTime) > nowMinutes;
    })
    .slice(0, limit);
};
export const formatActivityTime = (activity: Activity) => {
  const startDate = activity.startDate ?? activity.date;
  const endDate = activity.endDate ?? startDate;

  if (activity.allDay) {
    return startDate === endDate ? 'All day' : `${formatDateChip(startDate)} \u2013 ${formatDateChip(endDate)}`;
  }

  if (startDate !== endDate) {
    return `${formatDateChip(startDate)} ${activity.startTime} \u2013 ${formatDateChip(endDate)} ${activity.endTime}`;
  }

  return `${activity.startTime} \u2013 ${activity.endTime}`;
};
export const createDraftActivity = (date = getTodayISO()): ActivityDraft => {
  const now = new Date();
  const startHours = now.getHours();
  const startMinutes = now.getMinutes();
  const nextHour = startHours + 1;
  const endDate = nextHour >= 24 ? addDays(date, 1) : date;
  const endTime = nextHour >= 24 ? '00:00' : `${pad2(nextHour)}:00`;

  return {
    id: `activity-${Date.now()}`,
    title: '',
    description: '',
    date,
    startDate: date,
    endDate,
    startTime: `${pad2(startHours)}:${pad2(startMinutes)}`,
    endTime,
    category: 'Productivity',
    color: accent,
    allDay: false,
    repeat: 'none',
    customWeekdays: [getMondayWeekdayIndex(date)],
  };
};
export const normalizeActivityDraft = (draft: ActivityDraft): ActivityDraft => {
  const startDate = draft.startDate ?? draft.date;
  let endDate = draft.endDate ?? startDate;
  let endTime = draft.endTime;

  if (endDate < startDate) {
    endDate = startDate;
  }

  if (endDate === startDate && parseTimeToMinutes(endTime) <= parseTimeToMinutes(draft.startTime)) {
    const nextEndMinutes = parseTimeToMinutes(draft.startTime) + 1;
    endDate = nextEndMinutes >= 1440 ? addDays(startDate, 1) : endDate;
    endTime = formatTimeFromMinutes(nextEndMinutes);
  }

  return {
    ...draft,
    date: startDate,
    startDate,
    endDate,
    endTime,
  };
};
