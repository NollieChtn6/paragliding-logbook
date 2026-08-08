import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { signOutAction } from "./sign-out";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { signOut: vi.fn() } } }));

describe("signOutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
  });

  it("calls auth.api.signOut and redirects to /", async () => {
    vi.mocked(auth.api.signOut).mockResolvedValue({ success: true } as never);

    await signOutAction();

    expect(auth.api.signOut).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
