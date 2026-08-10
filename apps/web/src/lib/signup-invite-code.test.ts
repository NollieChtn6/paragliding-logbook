import { afterEach, describe, expect, it, vi } from "vitest";
import { isSignUpInviteCodeRequired, isSignUpInviteCodeValid } from "./signup-invite-code";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isSignUpInviteCodeRequired", () => {
  it("is false when SIGNUP_INVITE_CODE is not set", () => {
    vi.stubEnv("SIGNUP_INVITE_CODE", "");

    expect(isSignUpInviteCodeRequired()).toBe(false);
  });

  it("is true when SIGNUP_INVITE_CODE is set", () => {
    vi.stubEnv("SIGNUP_INVITE_CODE", "482913");

    expect(isSignUpInviteCodeRequired()).toBe(true);
  });
});

describe("isSignUpInviteCodeValid", () => {
  it("accepts any code when SIGNUP_INVITE_CODE is not set", () => {
    vi.stubEnv("SIGNUP_INVITE_CODE", "");

    expect(isSignUpInviteCodeValid("000000")).toBe(true);
  });

  it("accepts the exact configured code", () => {
    vi.stubEnv("SIGNUP_INVITE_CODE", "482913");

    expect(isSignUpInviteCodeValid("482913")).toBe(true);
  });

  it("rejects a wrong code", () => {
    vi.stubEnv("SIGNUP_INVITE_CODE", "482913");

    expect(isSignUpInviteCodeValid("111111")).toBe(false);
  });
});
