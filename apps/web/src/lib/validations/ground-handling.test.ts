import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { groundHandlingSchema } from "./ground-handling";

const validGroundHandling = {
  date: "2025-01-15",
  time: "10:00",
  spotId: "550e8400-e29b-41d4-a716-446655440000",
  durationMin: "30",
  exercises: "Contrôle au sol, gestion des surventes.",
};

describe.each(["fr-FR", "en-GB"] as const)("groundHandlingSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.groundHandling;
  const schema = groundHandlingSchema(t);

  it("accepts a valid ground handling session", () => {
    const result = schema.safeParse(validGroundHandling);
    expect(result.success).toBe(true);
  });

  it("accepts optional difficulties and feeling", () => {
    const result = schema.safeParse({
      ...validGroundHandling,
      difficulties: "Vent changeant.",
      feeling: "Bonne séance.",
    });
    expect(result.success).toBe(true);
  });

  it("treats an empty difficulties as absent", () => {
    const result = schema.safeParse({ ...validGroundHandling, difficulties: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.difficulties).toBeUndefined();
    }
  });

  it("treats an empty trainingCampId as absent", () => {
    const result = schema.safeParse({ ...validGroundHandling, trainingCampId: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trainingCampId).toBeUndefined();
    }
  });

  it("rejects a session without a date or spot", () => {
    const { date, spotId, ...rest } = validGroundHandling;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a negative duration with a user-friendly message", () => {
    const result = schema.safeParse({ ...validGroundHandling, durationMin: "-10" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.durationPositive);
    }
  });

  it("rejects an empty exercises field with a user-friendly message", () => {
    const result = schema.safeParse({ ...validGroundHandling, exercises: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.exercisesRequired);
    }
  });

  it("rejects a malformed time with a user-friendly message", () => {
    const result = schema.safeParse({ ...validGroundHandling, time: "25:99" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.timeInvalid);
    }
  });

  it("combines date and time into a single UTC Date", () => {
    const result = schema.safeParse(validGroundHandling);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date.toISOString()).toBe("2025-01-15T10:00:00.000Z");
    }
  });
});
