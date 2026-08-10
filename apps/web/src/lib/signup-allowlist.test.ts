import { afterEach, describe, expect, it, vi } from "vitest";
import { isSignUpAllowed } from "./signup-allowlist";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isSignUpAllowed", () => {
  it("allows any email when SIGNUP_ALLOWED_EMAILS is not set", () => {
    vi.stubEnv("SIGNUP_ALLOWED_EMAILS", "");

    expect(isSignUpAllowed("anyone@example.fr")).toBe(true);
  });

  it("allows an email present in the allow-list", () => {
    vi.stubEnv("SIGNUP_ALLOWED_EMAILS", "moi@example.fr, proche@example.fr");

    expect(isSignUpAllowed("proche@example.fr")).toBe(true);
  });

  it("rejects an email absent from the allow-list", () => {
    vi.stubEnv("SIGNUP_ALLOWED_EMAILS", "moi@example.fr,proche@example.fr");

    expect(isSignUpAllowed("inconnu@example.fr")).toBe(false);
  });

  it("compares case-insensitively", () => {
    vi.stubEnv("SIGNUP_ALLOWED_EMAILS", "Moi@Example.fr");

    expect(isSignUpAllowed("moi@example.fr")).toBe(true);
  });
});
