import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { equipmentSchema, updateEquipmentSchema } from "./equipment";

const validEquipment = {
  equipmentTypeId: "550e8400-e29b-41d4-a716-446655440000",
  brand: "Ozone",
  model: "Rush 6",
  purchaseDate: "2025-01-10",
  condition: "NEW",
};

describe.each(["fr-FR", "en-GB"] as const)("equipmentSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.equipment;
  const schema = equipmentSchema(t);

  it("accepts a valid equipment", () => {
    const result = schema.safeParse(validEquipment);
    expect(result.success).toBe(true);
  });

  it("accepts an optional size", () => {
    const result = schema.safeParse({ ...validEquipment, size: "26" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe("26");
    }
  });

  it("treats an empty size as absent", () => {
    const result = schema.safeParse({ ...validEquipment, size: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBeUndefined();
    }
  });

  it("defaults initialUsageMin to 0 when absent", () => {
    const result = schema.safeParse(validEquipment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.initialUsageMin).toBe(0);
    }
  });

  it("rejects an equipment without a type", () => {
    const { equipmentTypeId, ...rest } = validEquipment;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a malformed equipment type id with a user-friendly message", () => {
    const result = schema.safeParse({ ...validEquipment, equipmentTypeId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.typeInvalid);
    }
  });

  it("rejects an equipment without a brand", () => {
    const { brand, ...rest } = validEquipment;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an equipment without a model", () => {
    const { model, ...rest } = validEquipment;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an equipment without a purchase date", () => {
    const { purchaseDate, ...rest } = validEquipment;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid condition", () => {
    const result = schema.safeParse({ ...validEquipment, condition: "REFURBISHED" });
    expect(result.success).toBe(false);
  });

  it("accepts a used equipment with an initial usage volume", () => {
    const result = schema.safeParse({ ...validEquipment, condition: "USED", initialUsageMin: 600 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.initialUsageMin).toBe(600);
    }
  });

  it("rejects a non-zero initial usage volume for a new equipment", () => {
    const result = schema.safeParse({ ...validEquipment, condition: "NEW", initialUsageMin: 100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.initialUsageRequiresUsed);
    }
  });

  it("rejects a negative initial usage volume", () => {
    const result = schema.safeParse({
      ...validEquipment,
      condition: "USED",
      initialUsageMin: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer initial usage volume", () => {
    const result = schema.safeParse({
      ...validEquipment,
      condition: "USED",
      initialUsageMin: 10.5,
    });
    expect(result.success).toBe(false);
  });
});

describe.each(["fr-FR", "en-GB"] as const)("updateEquipmentSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.equipment;
  const schema = updateEquipmentSchema(t);

  it("accepts a valid equipment with a status", () => {
    const result = schema.safeParse({ ...validEquipment, status: "ACTIVE" });
    expect(result.success).toBe(true);
  });

  it("accepts SOLD and RETIRED statuses", () => {
    for (const status of ["SOLD", "RETIRED"]) {
      const result = schema.safeParse({ ...validEquipment, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an equipment without a status", () => {
    const result = schema.safeParse(validEquipment);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = schema.safeParse({ ...validEquipment, status: "LOST" });
    expect(result.success).toBe(false);
  });
});
