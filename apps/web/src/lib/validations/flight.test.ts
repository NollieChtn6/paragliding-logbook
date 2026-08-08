import { describe, expect, it } from "vitest";
import { flightSchema } from "./flight";

const validFlight = {
  date: "2025-01-15",
  departurePointId: "550e8400-e29b-41d4-a716-446655440000",
  arrivalPointId: "660e8400-e29b-41d4-a716-446655440001",
  durationMin: "35",
  flightTypeId: "770e8400-e29b-41d4-a716-446655440002",
  observations: "Quiet evening flight.",
  improvementPoints: "Work on approach phases.",
};

describe("flightSchema", () => {
  it("accepts a valid flight", () => {
    const result = flightSchema.safeParse(validFlight);
    expect(result.success).toBe(true);
  });

  it("rejects a flight without a departure or arrival point", () => {
    const { departurePointId, arrivalPointId, ...rest } = validFlight;
    const result = flightSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts the same point as both departure and arrival (top-landing)", () => {
    const result = flightSchema.safeParse({
      ...validFlight,
      arrivalPointId: validFlight.departurePointId,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative duration", () => {
    const result = flightSchema.safeParse({ ...validFlight, durationMin: "-10" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed flight type id", () => {
    const result = flightSchema.safeParse({ ...validFlight, flightTypeId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a date in the future", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = flightSchema.safeParse({
      ...validFlight,
      date: tomorrow.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });
});
