import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { schoolSchema } from "./school";

const validSchool = {
  name: "École de test",
  address: "1 rue du Vol Libre",
  postalCode: "38660",
  city: "Plateau-des-Petites-Roches",
  countryCode: "FR",
  website: "https://www.exemple.fr",
};

describe.each(["fr-FR", "en-GB"] as const)("schoolSchema (%s)", (locale) => {
  const t = getDictionary(locale).validation.school;
  const schema = schoolSchema(t);

  it("accepts a valid school", () => {
    const result = schema.safeParse(validSchool);
    expect(result.success).toBe(true);
  });

  it("accepts a school with only a name", () => {
    const result = schema.safeParse({ name: "École minimale" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const { name, ...rest } = validSchool;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = schema.safeParse({ ...validSchool, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.nameRequired);
    }
  });

  it("rejects an invalid website URL", () => {
    const result = schema.safeParse({ ...validSchool, website: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.websiteInvalid);
    }
  });

  it("treats an empty website as absent", () => {
    const result = schema.safeParse({ ...validSchool, website: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBeUndefined();
    }
  });

  it("rejects a country code that isn't 2 letters", () => {
    const result = schema.safeParse({ ...validSchool, countryCode: "France" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(t.countryCodeInvalid);
    }
  });
});
