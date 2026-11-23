import type { BookingRequest } from "../drizzle/schema";

export type BookingStatus = BookingRequest["status"];
export type BookingTransitionTarget = Extract<BookingStatus, "confirmed" | "cancelled" | "completed">;

/** Only allow operationally valid booking lifecycle transitions. */
export function canTransitionBookingStatus(
  current: BookingStatus,
  target: BookingTransitionTarget,
): boolean {
  if (current === "requested") return target === "confirmed" || target === "cancelled";
  if (current === "confirmed") return target === "completed" || target === "cancelled";
  return false;
}
