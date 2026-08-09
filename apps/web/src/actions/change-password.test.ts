import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { changePassword } from "@/features/account";
import { requireCurrentUser } from "@/lib/current-user";
import { changePasswordAction } from "./change-password";

// Même approche que create-flight.test.ts : changePassword et
// requireCurrentUser sont mockés, on ne vérifie ici que le comportement
// propre à l'action (mapping des erreurs, pas de redirect en cas de succès).
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/features/account", () => ({ changePassword: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));

const CURRENT_USER = { id: "current-user-id" };

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls changePassword with the submitted data and returns success, without redirecting", async () => {
    vi.mocked(changePassword).mockResolvedValue(undefined);
    const formData = formDataFor({
      currentPassword: "old-password",
      newPassword: "a-new-password-12",
      confirmPassword: "a-new-password-12",
    });

    const result = await changePasswordAction(null, formData);

    expect(changePassword).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        currentPassword: "old-password",
        newPassword: "a-new-password-12",
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it("maps a ZodError from changePassword to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(changePassword).mockRejectedValue(zodError);

    const result = await changePasswordAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
  });

  it("maps an APIError (wrong current password) to a clear message", async () => {
    vi.mocked(changePassword).mockRejectedValue(
      new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD", message: "Invalid password" }),
    );

    const result = await changePasswordAction(null, new FormData());

    expect(result).toEqual({ success: false, error: "Mot de passe actuel incorrect." });
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(changePassword).mockRejectedValue(new Error("boom"));

    const result = await changePasswordAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: "Erreur lors du changement de mot de passe.",
    });
  });
});
