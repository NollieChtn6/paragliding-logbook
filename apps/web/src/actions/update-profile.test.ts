import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { updateProfile } from "@/features/account";
import { requireCurrentUser } from "@/lib/current-user";
import { updateProfileAction } from "./update-profile";

// Même approche que change-password.test.ts : updateProfile et
// requireCurrentUser sont mockés, on ne vérifie ici que le comportement
// propre à l'action (mapping des erreurs, pas de redirect en cas de succès).
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/features/account", () => ({ updateProfile: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));

const CURRENT_USER = { id: "current-user-id" };

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("updateProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls updateProfile with the submitted data and returns success, without redirecting", async () => {
    vi.mocked(updateProfile).mockResolvedValue(undefined);
    const formData = formDataFor({ name: "Jane Doe" });

    const result = await updateProfileAction(null, formData);

    expect(updateProfile).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ name: "Jane Doe" }),
    );
    expect(result).toEqual({ success: true });
  });

  it("maps a ZodError from updateProfile to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateProfile).mockRejectedValue(zodError);

    const result = await updateProfileAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new Error("boom"));

    const result = await updateProfileAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: "Erreur lors de la mise à jour du profil.",
    });
  });
});
