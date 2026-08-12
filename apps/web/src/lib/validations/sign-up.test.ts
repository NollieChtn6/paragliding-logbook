import { describe, expect, it } from "vitest";
import { signUpSchema } from "./sign-up";

const validInput = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  password: "a-strong-password-12",
  confirmPassword: "a-strong-password-12",
};

describe("signUpSchema", () => {
  it("accepts valid data", () => {
    const result = signUpSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("trims the name and rejects an empty one", () => {
    const trimmed = signUpSchema.safeParse({ ...validInput, name: "  Jane Doe  " });
    expect(trimmed.success).toBe(true);
    if (trimmed.success) {
      expect(trimmed.data.name).toBe("Jane Doe");
    }

    const empty = signUpSchema.safeParse({ ...validInput, name: "   " });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]?.message).toBe("Le prénom est obligatoire.");
    }
  });

  it("rejects a name longer than 100 characters", () => {
    const result = signUpSchema.safeParse({ ...validInput, name: "a".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Le prénom ne doit pas dépasser 100 caractères.",
      );
    }
  });

  it("normalizes the email to lowercase and trims it", () => {
    const result = signUpSchema.safeParse({ ...validInput, email: "  Jane.Doe@Example.COM  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane.doe@example.com");
    }
  });

  it("rejects an invalid email format", () => {
    const result = signUpSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("L'adresse email est invalide.");
    }
  });

  it("rejects a password shorter than 12 characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "short12345",
      confirmPassword: "short12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Le mot de passe doit contenir au moins 12 caractères.",
      );
    }
  });

  it("rejects a confirmation that doesn't match the password", () => {
    const result = signUpSchema.safeParse({ ...validInput, confirmPassword: "something-else-12" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La confirmation ne correspond pas au mot de passe.",
      );
    }
  });
});
