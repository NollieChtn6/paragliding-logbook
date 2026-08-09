import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { updateSitePoint } from "@/features/site-points";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { updateSitePointAction } from "./update-site-point";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/site-points", () => ({ updateSitePoint: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const POINT_ID = "point-id";

describe("updateSitePointAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before updating the point", async () => {
    vi.mocked(updateSitePoint).mockResolvedValue({} as never);

    await updateSitePointAction(POINT_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls updateSitePoint with the point id and submitted data, and redirects on success", async () => {
    vi.mocked(updateSitePoint).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("label", "Point modifié");

    await updateSitePointAction(POINT_ID, null, formData);

    expect(updateSitePoint).toHaveBeenCalledWith(
      POINT_ID,
      expect.objectContaining({ label: "Point modifié" }),
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/site-points", "Point modifié."));
  });

  it("maps a ZodError from updateSitePoint to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateSitePoint).mockRejectedValue(zodError);

    const result = await updateSitePointAction(POINT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateSitePoint).mockRejectedValue(new Error("boom"));

    const result = await updateSitePointAction(POINT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la modification du point." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
