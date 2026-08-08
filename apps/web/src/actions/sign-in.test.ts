import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { signInAction } from "./sign-in";

// Ne re-teste pas signInEmail lui-même (déjà couvert par
// lib/auth.integration.test.ts, contre une vraie base) : auth.api.signInEmail
// est mocké, on ne vérifie ici que le comportement propre à l'action
// (validation des champs, mapping des erreurs, redirect).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { signInEmail: vi.fn() } } }));

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("signInAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when email or password is missing", async () => {
    const result = await signInAction(null, formDataFor({ email: "dev@example.local" }));

    expect(result).toEqual({ success: false, error: "Email et mot de passe requis." });
    expect(auth.api.signInEmail).not.toHaveBeenCalled();
  });

  it("calls signInEmail and redirects on success", async () => {
    vi.mocked(auth.api.signInEmail).mockResolvedValue({} as never);
    const formData = formDataFor({ email: "dev@example.local", password: "correct-password" });

    await signInAction(null, formData);

    expect(auth.api.signInEmail).toHaveBeenCalledWith({
      body: { email: "dev@example.local", password: "correct-password" },
    });
    expect(redirect).toHaveBeenCalledWith("/activities");
  });

  it("maps any signInEmail failure to a generic error, without leaking the cause", async () => {
    vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error("Invalid email or password"));
    const formData = formDataFor({ email: "dev@example.local", password: "wrong-password" });

    const result = await signInAction(null, formData);

    expect(result).toEqual({ success: false, error: "Email ou mot de passe incorrect." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
