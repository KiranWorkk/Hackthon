/** Adds minutes to a "H:MM AM/PM" label, e.g. ("9:00 AM", 20) -> "9:20 AM". */
export function addMinutesToTimeLabel(label: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!match) return label;

  const [, hourStr, minuteStr, period] = match;
  let hour = Number(hourStr) % 12;
  if (period.toUpperCase() === "PM") hour += 12;

  const totalMinutes = hour * 60 + Number(minuteStr) + minutes;
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const resultHour24 = Math.floor(normalized / 60);
  const resultMinute = normalized % 60;

  const resultPeriod = resultHour24 >= 12 ? "PM" : "AM";
  const resultHour12 = resultHour24 % 12 === 0 ? 12 : resultHour24 % 12;

  return `${resultHour12}:${String(resultMinute).padStart(2, "0")} ${resultPeriod}`;
}
