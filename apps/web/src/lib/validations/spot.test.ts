import { describe, expect, it } from "vitest";
import { spotSchema } from "./spot";

const validSpot = {
  name: "Saint-Hilaire-du-Touvet",
  region: "Auvergne-Rhône-Alpes",
  countryCode: "FR",
  latitude: "45.3",
  longitude: "5.9",
};

describe("spotSchema", () => {
  it("accepts a valid spot", () => {
    const result = spotSchema.safeParse(validSpot);
    expect(result.success).toBe(true);
  });

  it("accepts a spot with only a name", () => {
    const result = spotSchema.safeParse({ name: "Spot minimal" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const { name, ...rest } = validSpot;
    const result = spotSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = spotSchema.safeParse({ ...validSpot, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le nom est obligatoire.");
    }
  });

  it("normalizes the country code to uppercase", () => {
    const result = spotSchema.safeParse({ ...validSpot, countryCode: "fr" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("FR");
    }
  });

  it("rejects a country code that isn't 2 letters", () => {
    const result = spotSchema.safeParse({ ...validSpot, countryCode: "FRA" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Le code pays doit contenir exactement 2 lettres (ex. FR).",
      );
    }
  });

  it("rejects a latitude out of range", () => {
    const result = spotSchema.safeParse({ ...validSpot, latitude: "120" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La latitude doit être comprise entre -90 et 90.",
      );
    }
  });

  it("rejects a longitude out of range", () => {
    const result = spotSchema.safeParse({ ...validSpot, longitude: "-200" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La longitude doit être comprise entre -180 et 180.",
      );
    }
  });
});
