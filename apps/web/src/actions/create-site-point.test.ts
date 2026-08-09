import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createSitePoint } from "@/features/site-points";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { createSitePointAction } from "./create-site-point";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/site-points", () => ({ createSitePoint: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };

describe("createSitePointAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before creating the point", async () => {
    vi.mocked(createSitePoint).mockResolvedValue({} as never);

    await createSitePointAction(null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls createSitePoint with the submitted data and redirects on success", async () => {
    vi.mocked(createSitePoint).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("label", "Nouveau point");

    await createSitePointAction(null, formData);

    expect(createSitePoint).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Nouveau point" }),
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/site-points", "Point créé."));
  });

  it("maps a ZodError from createSitePoint to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createSitePoint).mockRejectedValue(zodError);

    const result = await createSitePointAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createSitePoint).mockRejectedValue(new Error("boom"));

    const result = await createSitePointAction(null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la création du point." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
