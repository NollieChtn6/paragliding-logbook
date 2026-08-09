import { describe, expect, it } from "vitest";
import { flightSchema } from "./flight";

const validFlight = {
  date: "2025-01-15",
  takeoffPointId: "550e8400-e29b-41d4-a716-446655440000",
  landingPointId: "660e8400-e29b-41d4-a716-446655440001",
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

  it("rejects a flight without a takeoff or landing point", () => {
    const { takeoffPointId, landingPointId, ...rest } = validFlight;
    const result = flightSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // Le format UUID seul ne distingue pas un point TAKEOFF d'un point LANDING
  // (nécessite une lecture en base) : la contrainte de type est vérifiée
  // dans le service, pas ici (docs/decisions/005-flight-takeoff-landing-points.md),
  // voir create-flight.service.integration.test.ts.
  it("rejects a negative duration with a French, user-friendly message", () => {
    const result = flightSchema.safeParse({ ...validFlight, durationMin: "-10" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("La durée doit être strictement positive.");
    }
  });

  it("rejects a malformed flight type id with a French, user-friendly message", () => {
    const result = flightSchema.safeParse({ ...validFlight, flightTypeId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le type de vol est invalide.");
    }
  });

  it("rejects empty observations with a French, user-friendly message", () => {
    const result = flightSchema.safeParse({ ...validFlight, observations: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Les observations sont obligatoires.");
    }
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
