import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./change-password";

const validInput = {
  currentPassword: "current-password",
  newPassword: "a-new-password-12",
  confirmPassword: "a-new-password-12",
};

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    const result = changePasswordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a missing current password", () => {
    const { currentPassword, ...rest } = validInput;
    const result = changePasswordSchema.safeParse({ ...rest, currentPassword: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Le mot de passe actuel est obligatoire.");
    }
  });

  it("rejects a new password shorter than 12 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: "short1234567",
      confirmPassword: "short1234567",
    });
    // 12 caractères exactement doit passer ("short1234567" fait 12) : on
    // vérifie ici en dessous de la limite.
    const tooShort = changePasswordSchema.safeParse({
      ...validInput,
      newPassword: "short12345",
      confirmPassword: "short12345",
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues[0]?.message).toBe(
        "Le nouveau mot de passe doit contenir au moins 12 caractères.",
      );
    }
    expect(result.success).toBe(true);
  });

  it("rejects a confirmation that doesn't match the new password", () => {
    const result = changePasswordSchema.safeParse({
      ...validInput,
      confirmPassword: "something-else-1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "La confirmation ne correspond pas au nouveau mot de passe.",
      );
    }
  });

  it("rejects a new password identical to the current one", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "same-password-1234",
      newPassword: "same-password-1234",
      confirmPassword: "same-password-1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Le nouveau mot de passe doit être différent de l'actuel.",
      );
    }
  });
});
