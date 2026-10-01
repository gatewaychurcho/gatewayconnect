import { ChurchEvent } from '../types';

export interface EventCountdownResult {
  isInSession: boolean;
  label: string;
  formatted: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  targetDate: Date;
}

/**
 * Calculates countdown status and time remaining for church services and events.
 * If the event is currently active, returns isInSession = true and label = "In Session".
 */
export function getEventCountdown(event: ChurchEvent, now: Date = new Date()): EventCountdownResult {
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday, etc.
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeDec = currentHours + currentMinutes / 60;

  const isSundayEvt = event.id === 'evt_sunday' || event.category === 'Sunday Service' || event.title.toLowerCase().includes('sunday');
  const isWednesdayEvt = event.id === 'evt_wednesday' || event.category === 'Wednesday Service' || event.title.toLowerCase().includes('wednesday');

  let targetDate = new Date(now);

  if (isSundayEvt) {
    // Sunday Glorious Service: 08:00 - 13:00
    const startHour = 8;
    const endHour = 13;

    if (currentDay === 0 && currentTimeDec >= startHour && currentTimeDec < endHour) {
      return {
        isInSession: true,
        label: 'In Session',
        formatted: 'In Session',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        targetDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0)
      };
    }

    // Calculate next Sunday at 08:00
    targetDate.setHours(startHour, 0, 0, 0);
    let daysUntilSunday = (7 - currentDay) % 7;
    if (currentDay === 0 && currentTimeDec >= endHour) {
      daysUntilSunday = 7;
    }
    targetDate.setDate(targetDate.getDate() + daysUntilSunday);
  } else if (isWednesdayEvt) {
    // Wednesday Midweek Dominion Service: 17:00 - 20:00
    const startHour = 17;
    const endHour = 20;

    if (currentDay === 3 && currentTimeDec >= startHour && currentTimeDec < endHour) {
      return {
        isInSession: true,
        label: 'In Session',
        formatted: 'In Session',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        targetDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0)
      };
    }

    // Calculate next Wednesday at 17:00
    targetDate.setHours(startHour, 0, 0, 0);
    let daysUntilWednesday = (3 - currentDay + 7) % 7;
    if (currentDay === 3 && currentTimeDec >= endHour) {
      daysUntilWednesday = 7;
    }
    targetDate.setDate(targetDate.getDate() + daysUntilWednesday);
  } else {
    // Generic or specific dated event
    if (event.target_datetime) {
      targetDate = new Date(event.target_datetime);
    } else {
      // Fallback: derive from date text or set 3 days from now
      const parsed = Date.parse(`${event.date} 09:00:00`);
      if (!isNaN(parsed) && parsed > now.getTime()) {
        targetDate = new Date(parsed);
      } else {
        targetDate = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
      }
    }

    // Assume 3 hour duration for generic events
    const eventEndTime = targetDate.getTime() + 3 * 3600 * 1000;
    if (now.getTime() >= targetDate.getTime() && now.getTime() < eventEndTime) {
      return {
        isInSession: true,
        label: 'In Session',
        formatted: 'In Session',
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        targetDate: new Date(eventEndTime)
      };
    }
  }

  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted += `${days}d `;
  }
  formatted += `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;

  return {
    isInSession: false,
    label: 'Starts In',
    formatted,
    days,
    hours,
    minutes,
    seconds,
    targetDate
  };
}
