export const formatTimestamp = (timestamp: Date, format: 'time' | 'date' | 'full' = 'full') => {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  
  // If it's today, just show the time
  if (date.toDateString() === now.toDateString()) {
    return formatTime(date);
  }
  
  // If it's yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return format === 'time' ? formatTime(date) : 'Yesterday';
  }
  
  // If it's within the last week, show the day name
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  if (date > oneWeekAgo) {
    return format === 'time' ? formatTime(date) : date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  // Otherwise show the date
  if (format === 'time') {
    return formatTime(date);
  } else if (format === 'date') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};