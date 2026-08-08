import { describe, expect, it } from "vitest";
import { groundHandlingSchema } from "./ground-handling";

const validGroundHandling = {
  date: "2025-01-15",
  siteId: "550e8400-e29b-41d4-a716-446655440000",
  durationMin: "30",
  exercises: "Contrôle au sol, gestion des surventes.",
};

describe("groundHandlingSchema", () => {
  it("accepts a valid ground handling session", () => {
    const result = groundHandlingSchema.safeParse(validGroundHandling);
    expect(result.success).toBe(true);
  });

  it("accepts optional difficulties and feeling", () => {
    const result = groundHandlingSchema.safeParse({
      ...validGroundHandling,
      difficulties: "Vent changeant.",
      feeling: "Bonne séance.",
    });
    expect(result.success).toBe(true);
  });

  it("treats an empty difficulties as absent", () => {
    const result = groundHandlingSchema.safeParse({ ...validGroundHandling, difficulties: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.difficulties).toBeUndefined();
    }
  });

  it("treats an empty trainingCampId as absent", () => {
    const result = groundHandlingSchema.safeParse({ ...validGroundHandling, trainingCampId: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trainingCampId).toBeUndefined();
    }
  });

  it("rejects a session without a date or site", () => {
    const { date, siteId, ...rest } = validGroundHandling;
    const result = groundHandlingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a negative duration", () => {
    const result = groundHandlingSchema.safeParse({ ...validGroundHandling, durationMin: "-10" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty exercises field", () => {
    const result = groundHandlingSchema.safeParse({ ...validGroundHandling, exercises: "  " });
    expect(result.success).toBe(false);
  });
});
