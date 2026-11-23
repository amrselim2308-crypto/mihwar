import { describe, expect, it } from "vitest";
import { canTransitionBookingStatus } from "./booking-state";

describe("booking status transitions", () => {
  it("allows requests to be confirmed or cancelled", () => {
    expect(canTransitionBookingStatus("requested", "confirmed")).toBe(true);
    expect(canTransitionBookingStatus("requested", "cancelled")).toBe(true);
  });

  it("allows confirmed bookings to be completed or cancelled", () => {
    expect(canTransitionBookingStatus("confirmed", "completed")).toBe(true);
    expect(canTransitionBookingStatus("confirmed", "cancelled")).toBe(true);
  });

  it("does not allow a request to be marked completed without confirmation", () => {
    expect(canTransitionBookingStatus("requested", "completed")).toBe(false);
  });

  it("does not allow transitions out of terminal states", () => {
    expect(canTransitionBookingStatus("cancelled", "confirmed")).toBe(false);
    expect(canTransitionBookingStatus("completed", "cancelled")).toBe(false);
  });
});
