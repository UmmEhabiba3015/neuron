const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
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

/*
 * The date is read as three numbers and never as a moment in time, so the
 * timezone of the browser cannot move it to the day before or after.
 */
export function formatDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const shortYear = String(year).slice(-2);

  return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month - 1]} '${shortYear}`;
}

/*
 * The time an entry was written, as "09:20", on the clock of the device
 * showing it.
 */
export function formatTime(instant: string): string {
  const at = new Date(instant);
  const hours = String(at.getHours()).padStart(2, '0');
  const minutes = String(at.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}
