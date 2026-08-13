import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { spotSchema } from "./spot";

const validSpot = {
  name: "Saint-Hilaire-du-Touvet",
  region: "Auvergne-Rhône-Alpes",
  countryCode: "FR",
  latitude: "45.3",
  longitude: "5.9",
};

describe.each(["fr-FR", "en-GB"] as const)("spotSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.spot;
  const schema = spotSchema(t);

  it("accepts a valid spot", () => {
    const result = schema.safeParse(validSpot);
    expect(result.success).toBe(true);
  });

  it("accepts a spot with only a name", () => {
    const result = schema.safeParse({ name: "Spot minimal" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const { name, ...rest } = validSpot;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = schema.safeParse({ ...validSpot, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.nameRequired);
    }
  });

  it("normalizes the country code to uppercase", () => {
    const result = schema.safeParse({ ...validSpot, countryCode: "fr" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("FR");
    }
  });

  it("rejects a country code that isn't 2 letters", () => {
    const result = schema.safeParse({ ...validSpot, countryCode: "FRA" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.countryCodeInvalid);
    }
  });

  it("rejects a latitude out of range", () => {
    const result = schema.safeParse({ ...validSpot, latitude: "120" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.latitudeRange);
    }
  });

  it("rejects a longitude out of range", () => {
    const result = schema.safeParse({ ...validSpot, longitude: "-200" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.longitudeRange);
    }
  });
});
