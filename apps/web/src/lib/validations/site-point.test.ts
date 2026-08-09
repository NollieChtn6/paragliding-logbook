import { describe, expect, it } from "vitest";
import { sitePointSchema } from "./site-point";

const validSitePoint = {
  label: "Décollage principal",
  siteId: "550e8400-e29b-41d4-a716-446655440000",
  sitePointTypeId: "660e8400-e29b-41d4-a716-446655440001",
  latitude: "45.3067",
  longitude: "5.888",
  altitudeM: "892",
  orientationDeg: "90",
};

describe("sitePointSchema", () => {
  it("accepts a valid site point", () => {
    const result = sitePointSchema.safeParse(validSitePoint);
    expect(result.success).toBe(true);
  });

  it("accepts a missing orientation", () => {
    const { orientationDeg, ...rest } = validSitePoint;
    const result = sitePointSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects a missing label", () => {
    const { label, ...rest } = validSitePoint;
    const result = sitePointSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty label", () => {
    const result = sitePointSchema.safeParse({ ...validSitePoint, label: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le nom est obligatoire.");
    }
  });

  it("rejects an invalid site id", () => {
    const result = sitePointSchema.safeParse({ ...validSitePoint, siteId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le site sélectionné est invalide.");
    }
  });

  it("rejects an invalid site point type id", () => {
    const result = sitePointSchema.safeParse({
      ...validSitePoint,
      sitePointTypeId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le type de point sélectionné est invalide.");
    }
  });

  it("rejects a latitude out of range", () => {
    const result = sitePointSchema.safeParse({ ...validSitePoint, latitude: "120" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La latitude doit être comprise entre -90 et 90.",
      );
    }
  });

  it("rejects a non-integer altitude", () => {
    const result = sitePointSchema.safeParse({ ...validSitePoint, altitudeM: "892.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "L'altitude doit être un nombre entier de mètres.",
      );
    }
  });

  it("rejects an orientation out of range", () => {
    const result = sitePointSchema.safeParse({ ...validSitePoint, orientationDeg: "400" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "L'orientation doit être comprise entre 0 et 360.",
      );
    }
  });
});
