import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { signInAction } from "./sign-in";

// Ne re-teste pas signInEmail lui-même (déjà couvert par
// lib/auth.integration.test.ts, contre une vraie base) : auth.api.signInEmail
// est mocké, on ne vérifie ici que le comportement propre à l'action
// (validation des champs, mapping des erreurs, redirect).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { signInEmail: vi.fn() } } }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");

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

    expect(result).toEqual({ success: false, error: t.auth.signIn.missingCredentials });
    expect(auth.api.signInEmail).not.toHaveBeenCalled();
  });

  it("calls signInEmail and redirects to /activities by default", async () => {
    vi.mocked(auth.api.signInEmail).mockResolvedValue({} as never);
    const formData = formDataFor({ email: "dev@example.local", password: "correct-password" });

    await signInAction(null, formData);

    expect(auth.api.signInEmail).toHaveBeenCalledWith({
      body: { email: "dev@example.local", password: "correct-password" },
    });
    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.signInSuccess));
  });

  it("redirects to redirectTo when it is a safe internal path", async () => {
    vi.mocked(auth.api.signInEmail).mockResolvedValue({} as never);
    const formData = formDataFor({
      email: "dev@example.local",
      password: "correct-password",
      redirectTo: "/activities/new",
    });

    await signInAction(null, formData);

    expect(redirect).toHaveBeenCalledWith(withToast("/activities/new", t.toast.signInSuccess));
  });

  it("falls back to /activities when redirectTo is an external URL (open redirect)", async () => {
    vi.mocked(auth.api.signInEmail).mockResolvedValue({} as never);
    const formData = formDataFor({
      email: "dev@example.local",
      password: "correct-password",
      redirectTo: "https://evil.example.com",
    });

    await signInAction(null, formData);

    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.signInSuccess));
  });

  it("maps any signInEmail failure to a generic error, without leaking the cause", async () => {
    vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error("Invalid email or password"));
    const formData = formDataFor({ email: "dev@example.local", password: "wrong-password" });

    const result = await signInAction(null, formData);

    expect(result).toEqual({ success: false, error: t.auth.signIn.invalidCredentials });
    expect(redirect).not.toHaveBeenCalled();
  });
});
