import { format, parseISO } from "date-fns";

export function formatDate(value: string | Date, pattern = "MM/dd/yyyy") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatTime(value: string | Date, pattern = "hh:mm a") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}
