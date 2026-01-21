import { format, isToday, isYesterday, parseISO } from 'date-fns';

// Helper function to ensure UTC datetime strings are properly parsed
function parseUTCDate(dateString: string): Date {
  // If the string doesn't end with 'Z' or have timezone info, treat it as UTC
  let normalizedString = dateString.trim();
  
  // Check if it already has timezone info (Z, +HH:MM, or -HH:MM pattern)
  const hasTimezone = normalizedString.endsWith('Z') || 
                       /[+-]\d{2}:\d{2}$/.test(normalizedString);
  
  if (!hasTimezone) {
    // If no timezone indicator, append 'Z' to treat as UTC
    // This handles cases where backend sends UTC time without timezone marker
    normalizedString = normalizedString + 'Z';
  }
  
  // parseISO will correctly parse UTC strings (ending in 'Z') and convert to local time
  return parseISO(normalizedString);
}

export function formatPostDate(dateString: string): string {
  // Parse UTC datetime and convert to local timezone
  const date = parseUTCDate(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM dd, yyyy');
  }
}

export function formatTimestamp(dateString: string): string {
  // Parse UTC datetime and convert to local timezone
  const date = parseUTCDate(dateString);
  return format(date, 'h:mm a');
}

export function formatDateTime(dateString: string): string {
  const date = parseUTCDate(dateString);
  return format(date, 'MMM dd, yyyy h:mm a');
}

export function groupPostsByDate<T extends { created_at: string }>(posts: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  posts.forEach((post) => {
    const dateKey = formatPostDate(post.created_at);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(post);
  });
  
  return grouped;
}
