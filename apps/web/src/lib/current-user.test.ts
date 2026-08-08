import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireCurrentUser } from "./current-user";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

const FAKE_USER = { id: "user-id", email: "dev@paragliding-logbook.local" };

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
  });

  it("returns null when there is no session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns the user matching the session's userId", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-id" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(FAKE_USER as never);

    const user = await getCurrentUser();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-id" } });
    expect(user).toEqual(FAKE_USER);
  });
});

describe("requireCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
  });

  it("redirects to /sign-in when there is no session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

    await requireCurrentUser();

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("returns the user without redirecting when a session exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-id" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(FAKE_USER as never);

    const user = await requireCurrentUser();

    expect(user).toEqual(FAKE_USER);
    expect(redirect).not.toHaveBeenCalled();
  });
});
