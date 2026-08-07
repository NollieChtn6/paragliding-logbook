import { describe, expect, it } from "vitest";
import { flightSchema } from "./flight";

const validFlight = {
  date: "2025-01-15",
  siteId: "550e8400-e29b-41d4-a716-446655440000",
  takeoffAltitudeM: "1200",
  landingAltitudeM: "450",
  durationMin: "35",
  flightType: "LOCAL",
  observations: "Quiet evening flight.",
  improvementPoints: "Work on approach phases.",
};

describe("flightSchema", () => {
  it("accepts a valid flight", () => {
    const result = flightSchema.safeParse(validFlight);
    expect(result.success).toBe(true);
  });

  it("rejects a flight without takeoff or landing altitude", () => {
    const { takeoffAltitudeM, landingAltitudeM, ...rest } = validFlight;
    const result = flightSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a takeoff altitude lower than the landing altitude", () => {
    const result = flightSchema.safeParse({
      ...validFlight,
      takeoffAltitudeM: "450",
      landingAltitudeM: "1200",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative duration", () => {
    const result = flightSchema.safeParse({ ...validFlight, durationMin: "-10" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid flight type", () => {
    const result = flightSchema.safeParse({ ...validFlight, flightType: "AEROBATIC" });
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
