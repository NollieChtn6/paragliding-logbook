import { describe, expect, it } from "vitest";
import { schoolSchema } from "./school";

const validSchool = {
  name: "École de test",
  address: "1 rue du Vol Libre",
  postalCode: "38660",
  city: "Plateau-des-Petites-Roches",
  countryCode: "FR",
  website: "https://www.exemple.fr",
};

describe("schoolSchema", () => {
  it("accepts a valid school", () => {
    const result = schoolSchema.safeParse(validSchool);
    expect(result.success).toBe(true);
  });

  it("accepts a school with only a name", () => {
    const result = schoolSchema.safeParse({ name: "École minimale" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const { name, ...rest } = validSchool;
    const result = schoolSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = schoolSchema.safeParse({ ...validSchool, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le nom est obligatoire.");
    }
  });

  it("rejects an invalid website URL", () => {
    const result = schoolSchema.safeParse({ ...validSchool, website: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Le site web doit être une URL valide (ex. https://exemple.fr).",
      );
    }
  });

  it("treats an empty website as absent", () => {
    const result = schoolSchema.safeParse({ ...validSchool, website: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBeUndefined();
    }
  });

  it("rejects a country code that isn't 2 letters", () => {
    const result = schoolSchema.safeParse({ ...validSchool, countryCode: "France" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Le code pays doit contenir exactement 2 lettres (ex. FR).",
      );
    }
  });
});
