import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { trainingCampSchema } from "./training-camp";

const validTrainingCamp = {
  startDate: "2025-01-10",
  endDate: "2025-01-15",
  schoolId: "550e8400-e29b-41d4-a716-446655440000",
  trainingCampTypeId: "660e8400-e29b-41d4-a716-446655440001",
};

describe.each(["fr-FR", "en-GB"] as const)("trainingCampSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.trainingCamp;
  const schema = trainingCampSchema(t);

  it("accepts a valid training camp", () => {
    const result = schema.safeParse(validTrainingCamp);
    expect(result.success).toBe(true);
  });

  it("accepts optional observations, summary and certification", () => {
    const result = schema.safeParse({
      ...validTrainingCamp,
      observations: "Groupe de 6 stagiaires, conditions venteuses le 2e jour.",
      summary: "Progression rapide.",
      certification: "Brevet de pilote",
    });
    expect(result.success).toBe(true);
  });

  it("treats an empty observations as absent", () => {
    const result = schema.safeParse({ ...validTrainingCamp, observations: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.observations).toBeUndefined();
    }
  });

  it("treats an empty summary as absent", () => {
    const result = schema.safeParse({ ...validTrainingCamp, summary: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary).toBeUndefined();
    }
  });

  it("rejects a training camp without a start or end date", () => {
    const { startDate, endDate, ...rest } = validTrainingCamp;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a training camp without a school", () => {
    const { schoolId, ...rest } = validTrainingCamp;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a malformed training camp type id with a user-friendly message", () => {
    const result = schema.safeParse({
      ...validTrainingCamp,
      trainingCampTypeId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.typeInvalid);
    }
  });

  it("rejects a start date after the end date", () => {
    const result = schema.safeParse({
      ...validTrainingCamp,
      startDate: "2025-01-15",
      endDate: "2025-01-10",
    });
    expect(result.success).toBe(false);
  });
});
