import { describe, expect, it } from "vitest";
import { siteSchema } from "./site";

const validSite = {
  label: "Décollage principal",
  spotId: "550e8400-e29b-41d4-a716-446655440000",
  siteTypeId: "660e8400-e29b-41d4-a716-446655440001",
  latitude: "45.3067",
  longitude: "5.888",
  altitudeM: "892",
  orientationDeg: "90",
};

describe("siteSchema", () => {
  it("accepts a valid site", () => {
    const result = siteSchema.safeParse(validSite);
    expect(result.success).toBe(true);
  });

  it("accepts a missing orientation", () => {
    const { orientationDeg, ...rest } = validSite;
    const result = siteSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects a missing label", () => {
    const { label, ...rest } = validSite;
    const result = siteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty label", () => {
    const result = siteSchema.safeParse({ ...validSite, label: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le nom est obligatoire.");
    }
  });

  it("rejects an invalid spot id", () => {
    const result = siteSchema.safeParse({ ...validSite, spotId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le spot sélectionné est invalide.");
    }
  });

  it("rejects an invalid site type id", () => {
    const result = siteSchema.safeParse({
      ...validSite,
      siteTypeId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le type de site sélectionné est invalide.");
    }
  });

  it("rejects a latitude out of range", () => {
    const result = siteSchema.safeParse({ ...validSite, latitude: "120" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La latitude doit être comprise entre -90 et 90.",
      );
    }
  });

  it("rejects a non-integer altitude", () => {
    const result = siteSchema.safeParse({ ...validSite, altitudeM: "892.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "L'altitude doit être un nombre entier de mètres.",
      );
    }
  });

  it("rejects an orientation out of range", () => {
    const result = siteSchema.safeParse({ ...validSite, orientationDeg: "400" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "L'orientation doit être comprise entre 0 et 360.",
      );
    }
  });
});
