import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { signUp } from "@/features/auth";
import { SignUpNotAllowedError } from "@/lib/signup-invite-code";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { signUpAction } from "./sign-up";

// Même approche que change-password.test.ts / sign-in.test.ts : signUp
// (features/auth) est mocké, on ne vérifie ici que le comportement propre à
// l'action (mapping des erreurs, redirect, redirectTo).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/auth", () => ({ signUp: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");

function formDataFor(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("signUpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signUp with the submitted data and redirects to /activities by default", async () => {
    vi.mocked(signUp).mockResolvedValue(undefined);
    const formData = formDataFor({
      name: "Jane Doe",
      email: "jane.doe@example.com",
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
    });

    await signUpAction(null, formData);

    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Jane Doe", email: "jane.doe@example.com" }),
      t.validation.signUp,
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.signUpSuccess));
  });

  it("redirects to redirectTo when it is a safe internal path", async () => {
    vi.mocked(signUp).mockResolvedValue(undefined);
    const formData = formDataFor({
      name: "Jane Doe",
      email: "jane.doe@example.com",
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
      redirectTo: "/activities/new",
    });

    await signUpAction(null, formData);

    expect(redirect).toHaveBeenCalledWith(withToast("/activities/new", t.toast.signUpSuccess));
  });

  it("falls back to /activities when redirectTo is an external URL (open redirect)", async () => {
    vi.mocked(signUp).mockResolvedValue(undefined);
    const formData = formDataFor({
      name: "Jane Doe",
      email: "jane.doe@example.com",
      password: "a-strong-password-12",
      confirmPassword: "a-strong-password-12",
      redirectTo: "https://evil.example.com",
    });

    await signUpAction(null, formData);

    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.signUpSuccess));
  });

  it("maps a ZodError from signUp to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(signUp).mockRejectedValue(zodError);

    const result = await signUpAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps a duplicate-email APIError to a clear message with emailAlreadyUsed set", async () => {
    vi.mocked(signUp).mockRejectedValue(
      new APIError("UNPROCESSABLE_ENTITY", {
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists. Use another email.",
      }),
    );

    const result = await signUpAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: t.auth.signUp.emailAlreadyUsed,
      emailAlreadyUsed: true,
    });
  });

  it("maps a SignUpNotAllowedError from signUp to its message", async () => {
    vi.mocked(signUp).mockRejectedValue(new SignUpNotAllowedError());

    const result = await signUpAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: t.auth.signUp.notAllowed,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps any other APIError to a generic message, without leaking the cause", async () => {
    vi.mocked(signUp).mockRejectedValue(
      new APIError("BAD_REQUEST", { code: "SOMETHING_ELSE", message: "internal detail" }),
    );

    const result = await signUpAction(null, new FormData());

    expect(result).toEqual({ success: false, error: t.auth.signUp.accountCreationFailed });
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(signUp).mockRejectedValue(new Error("boom"));

    const result = await signUpAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: t.auth.signUp.accountCreationError,
    });
  });
});
