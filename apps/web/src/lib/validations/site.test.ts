import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
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

describe.each(["fr-FR", "en-GB"] as const)("siteSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.site;
  const schema = siteSchema(t);

  it("accepts a valid site", () => {
    const result = schema.safeParse(validSite);
    expect(result.success).toBe(true);
  });

  it("accepts a missing orientation", () => {
    const { orientationDeg, ...rest } = validSite;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("rejects a missing label", () => {
    const { label, ...rest } = validSite;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty label", () => {
    const result = schema.safeParse({ ...validSite, label: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.labelRequired);
    }
  });

  it("rejects an invalid spot id", () => {
    const result = schema.safeParse({ ...validSite, spotId: "not-a-uuid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.spotInvalid);
    }
  });

  it("rejects an invalid site type id", () => {
    const result = schema.safeParse({
      ...validSite,
      siteTypeId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.siteTypeInvalid);
    }
  });

  it("rejects a latitude out of range", () => {
    const result = schema.safeParse({ ...validSite, latitude: "120" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.latitudeRange);
    }
  });

  it("rejects a non-integer altitude", () => {
    const result = schema.safeParse({ ...validSite, altitudeM: "892.5" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.altitudeInteger);
    }
  });

  it("rejects an orientation out of range", () => {
    const result = schema.safeParse({ ...validSite, orientationDeg: "400" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.orientationRange);
    }
  });
});
