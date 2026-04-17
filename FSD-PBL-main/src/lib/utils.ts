import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseTimeLabelToMinutes = (value: string) => {
  if (typeof value !== "string") return null;
  const v = value.trim();

  const m24 = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(v);
  if (m24) {
    const hh = Number(m24[1]);
    const mm = Number(m24[2]);
    return hh * 60 + mm;
  }

  const m12 = /^(0?\d|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(v);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2]);
    const ap = String(m12[3]).toUpperCase();
    if (hh === 12) hh = 0;
    if (ap === "PM") hh += 12;
    return hh * 60 + mm;
  }

  return null;
};

export const formatMinutesToTimeLabel = (minutes: number) => {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh24 = Math.floor(total / 60);
  const mm = total % 60;
  const ap = hh24 >= 12 ? "PM" : "AM";
  let hh12 = hh24 % 12;
  if (hh12 === 0) hh12 = 12;
  return `${String(hh12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ap}`;
};

export const getAppointmentStartDate = (apt: { date?: string; time?: string }) => {
  const dateStr = String(apt?.date || "");
  const timeStr = String(apt?.time || "");

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const minutes = parseTimeLabelToMinutes(timeStr);
  if (!m || minutes === null) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return new Date(year, month - 1, day, hh, mm, 0, 0);
};

export const getSlotStartDate = (slot: { date?: string; time?: string }) => {
  const dateStr = String(slot?.date || "");
  const timeStr = String(slot?.time || "");

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const minutes = parseTimeLabelToMinutes(timeStr);
  if (!m || minutes === null) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return new Date(year, month - 1, day, hh, mm, 0, 0);
};

export const compareSlotsByDateTime = (
  a: { date?: string; time?: string },
  b: { date?: string; time?: string },
) => {
  const da = getSlotStartDate(a)?.getTime() ?? 0;
  const db = getSlotStartDate(b)?.getTime() ?? 0;
  return da - db;
};

export const compareSlotsForList = (
  a: { date?: string; time?: string; isBooked?: boolean },
  b: { date?: string; time?: string; isBooked?: boolean },
) => {
  // Keep available slots first; booked slots go down.
  const ba = a?.isBooked ? 1 : 0;
  const bb = b?.isBooked ? 1 : 0;
  if (ba !== bb) return ba - bb;
  return compareSlotsByDateTime(a, b);
};

export const isAppointmentExpired = (apt: { date?: string; time?: string; durationMinutes?: number; status?: string }, now = new Date()) => {
  if (apt?.status !== "Booked") return false;
  const start = getAppointmentStartDate(apt);
  if (!start) return false;
  const duration = Number(apt?.durationMinutes || 15);
  const end = new Date(start.getTime() + duration * 60_000);
  return end.getTime() < now.getTime();
};

export const getAppointmentTimeRangeLabel = (apt: { time?: string; durationMinutes?: number }) => {
  const startLabel = String(apt?.time || "");
  const startMinutes = parseTimeLabelToMinutes(startLabel);
  const duration = Number(apt?.durationMinutes || 15);
  if (startMinutes === null || !Number.isFinite(duration) || duration <= 0) return startLabel;
  const endLabel = formatMinutesToTimeLabel(startMinutes + duration);
  return `${startLabel} - ${endLabel}`;
};

export const getTimeRangeLabel = (startTimeLabel: string, durationMinutes: number) => {
  const startLabel = String(startTimeLabel || "");
  const startMinutes = parseTimeLabelToMinutes(startLabel);
  const duration = Number(durationMinutes || 0);
  if (startMinutes === null || !Number.isFinite(duration) || duration <= 0) return startLabel;
  const endLabel = formatMinutesToTimeLabel(startMinutes + duration);
  return `${startLabel} - ${endLabel}`;
};

export type AppointmentDisplayStatus = "Booked" | "Visited" | "Not Visited" | "Expired";

export const getAppointmentDisplayStatus = (apt: { status?: string; date?: string; time?: string; durationMinutes?: number }, now = new Date()): AppointmentDisplayStatus => {
  if (apt?.status === "Visited") return "Visited";
  if (apt?.status === "NoShow") return "Not Visited";
  if (isAppointmentExpired(apt, now)) return "Expired";
  return "Booked";
};

export const compareAppointmentsForList = (
  a: { status?: string; date?: string; time?: string; durationMinutes?: number },
  b: { status?: string; date?: string; time?: string; durationMinutes?: number },
  now = new Date(),
) => {
  const sa = getAppointmentDisplayStatus(a, now);
  const sb = getAppointmentDisplayStatus(b, now);

  const rank = (s: AppointmentDisplayStatus) => {
    if (s === "Booked") return 0;
    if (s === "Visited" || s === "Not Visited") return 1;
    return 2; // Expired last
  };

  const ra = rank(sa);
  const rb = rank(sb);
  if (ra !== rb) return ra - rb;

  const da = getAppointmentStartDate(a)?.getTime() ?? 0;
  const db = getAppointmentStartDate(b)?.getTime() ?? 0;

  // Within groups:
  // - Upcoming (Booked) shows earliest first.
  // - Past/Completed (Visited/Not Visited/Expired) shows newest first.
  if (sa === "Booked") return da - db;
  return db - da;
};
