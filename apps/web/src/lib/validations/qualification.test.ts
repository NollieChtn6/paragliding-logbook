import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { qualificationSchema } from "./qualification";

const validQualification = {
  qualificationTypeId: "550e8400-e29b-41d4-a716-446655440000",
  obtainedDate: "2025-01-10",
};

describe.each(["fr-FR", "en-GB"] as const)("qualificationSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.qualification;
  const schema = qualificationSchema(t);

  it("accepts a valid qualification", () => {
    const result = schema.safeParse(validQualification);
    expect(result.success).toBe(true);
  });

  it("accepts optional schoolId, trainingCampId and notes", () => {
    const result = schema.safeParse({
      ...validQualification,
      schoolId: "660e8400-e29b-41d4-a716-446655440001",
      trainingCampId: "770e8400-e29b-41d4-a716-446655440002",
      notes: "Obtenu après un stage de 5 jours.",
    });
    expect(result.success).toBe(true);
  });

  it("treats an empty schoolId as absent", () => {
    const result = schema.safeParse({ ...validQualification, schoolId: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.schoolId).toBeUndefined();
    }
  });

  it("treats an empty notes as absent", () => {
    const result = schema.safeParse({ ...validQualification, notes: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("rejects a qualification without a type", () => {
    const { qualificationTypeId, ...rest } = validQualification;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a malformed qualification type id with a user-friendly message", () => {
    const result = schema.safeParse({ ...validQualification, qualificationTypeId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.typeInvalid);
    }
  });

  it("rejects a qualification without an obtained date", () => {
    const { obtainedDate, ...rest } = validQualification;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an obtained date in the future", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = schema.safeParse({ ...validQualification, obtainedDate: tomorrow });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.obtainedDateInFuture);
    }
  });

  it("accepts today as the obtained date", () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = schema.safeParse({ ...validQualification, obtainedDate: today });
    expect(result.success).toBe(true);
  });
});
