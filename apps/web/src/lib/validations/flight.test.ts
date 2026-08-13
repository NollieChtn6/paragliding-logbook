import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { flightSchema } from "./flight";

const validFlight = {
  date: "2025-01-15",
  time: "14:30",
  takeoffPointId: "550e8400-e29b-41d4-a716-446655440000",
  landingPointId: "660e8400-e29b-41d4-a716-446655440001",
  durationMin: "35",
  flightTypeId: "770e8400-e29b-41d4-a716-446655440002",
  observations: "Quiet evening flight.",
  improvementPoints: "Work on approach phases.",
};

describe.each(["fr-FR", "en-GB"] as const)("flightSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.flight;
  const schema = flightSchema(t);

  it("accepts a valid flight", () => {
    const result = schema.safeParse(validFlight);
    expect(result.success).toBe(true);
  });

  it("rejects a flight without a takeoff or landing point", () => {
    const { takeoffPointId, landingPointId, ...rest } = validFlight;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // Le format UUID seul ne distingue pas un point TAKEOFF d'un point LANDING
  // (nécessite une lecture en base) : la contrainte de type est vérifiée
  // dans le service, pas ici (docs/decisions/005-flight-takeoff-landing-points.md),
  // voir create-flight.service.integration.test.ts.
  it("rejects a negative duration with a user-friendly message", () => {
    const result = schema.safeParse({ ...validFlight, durationMin: "-10" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.durationPositive);
    }
  });

  it("rejects a malformed flight type id with a user-friendly message", () => {
    const result = schema.safeParse({ ...validFlight, flightTypeId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.flightTypeInvalid);
    }
  });

  it("rejects empty observations with a user-friendly message", () => {
    const result = schema.safeParse({ ...validFlight, observations: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.observationsRequired);
    }
  });

  it("rejects a date in the future", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = schema.safeParse({
      ...validFlight,
      date: tomorrow.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed time with a user-friendly message", () => {
    const result = schema.safeParse({ ...validFlight, time: "25:99" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.timeInvalid);
    }
  });

  // L'heure permet d'ordonner plusieurs vols le même jour (voir
  // getActivityEventDate, features/activities/queries.ts) : combinée en un
  // Date UTC littéral, sans conversion de fuseau horaire (voir le
  // commentaire au-dessus de flightSchema).
  it("combines date and time into a single UTC Date", () => {
    const result = schema.safeParse(validFlight);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date.toISOString()).toBe("2025-01-15T14:30:00.000Z");
    }
  });
});
