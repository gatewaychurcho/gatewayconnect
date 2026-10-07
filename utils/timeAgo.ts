/**
 * Utility for formatting real-time relative timestamps
 * Handles "Just now", "10 minutes ago", "5 hrs ago", "a week ago", "a month ago", etc.
 */

export function formatTimeAgo(dateInput: string | number | Date | undefined, style: 'descriptive' | 'short' = 'descriptive'): string {
  if (!dateInput) return 'Just now';

  let timestamp: number;
  if (typeof dateInput === 'string') {
    // If it's already a descriptive label from mock or static string like "Just Now", return or parse
    const lower = dateInput.toLowerCase();
    if (lower === 'just now' || lower === 'just now • live') {
      return 'Just now';
    }
    const parsed = Date.parse(dateInput);
    if (isNaN(parsed)) {
      // Return as-is if unparseable custom string
      return dateInput;
    }
    timestamp = parsed;
  } else if (typeof dateInput === 'number') {
    timestamp = dateInput;
  } else if (dateInput instanceof Date) {
    timestamp = dateInput.getTime();
  } else {
    return 'Just now';
  }

  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (elapsedSeconds < 45) {
    return 'Just now';
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) {
    if (style === 'short') return `${minutes}m`;
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (style === 'short') return `${hours}h`;
    return hours === 1 ? '1 hr ago' : `${hours} hrs ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    if (style === 'short') return `${days}d`;
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);
  if (days < 30) {
    if (style === 'short') return `${weeks}w`;
    return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    if (style === 'short') return `${months}mo`;
    return months === 1 ? 'a month ago' : `${months} months ago`;
  }

  const years = Math.floor(days / 365);
  if (style === 'short') return `${years}y`;
  return years === 1 ? 'a year ago' : `${years} years ago`;
}

/**
 * Returns an ISO string from an offset (e.g. 10 minutes ago, 5 hours ago)
 * Helper for creating authentic timestamps
 */
export function getRelativeIsoTime(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString();
}
