import { getSessionCookie } from "better-auth/cookies";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

vi.mock("better-auth/cookies", () => ({ getSessionCookie: vi.fn() }));

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /sign-in with a redirectTo param when there is no session cookie", () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = new NextRequest("http://localhost:3000/activities/new");

    const response = proxy(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("redirectTo")).toBe("/activities/new");
  });

  it('redirects to /sign-in when there is no session cookie for the dashboard ("/")', () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = new NextRequest("http://localhost:3000/");

    const response = proxy(request);

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("redirectTo")).toBe("/");
  });

  it("preserves the query string in redirectTo", () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = new NextRequest("http://localhost:3000/activities?foo=bar");

    const response = proxy(request);

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.get("redirectTo")).toBe("/activities?foo=bar");
  });

  it("lets the request through when a session cookie is present", () => {
    vi.mocked(getSessionCookie).mockReturnValue("some-session-token");
    const request = new NextRequest("http://localhost:3000/activities");

    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
