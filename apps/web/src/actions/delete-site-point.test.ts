import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSitePoint } from "@/features/site-points";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { deleteSitePointAction } from "./delete-site-point";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/site-points", () => ({ deleteSitePoint: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const POINT_ID = "point-id";

describe("deleteSitePointAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before deleting the point", async () => {
    vi.mocked(deleteSitePoint).mockResolvedValue(undefined);

    await deleteSitePointAction(POINT_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls deleteSitePoint with the point id and redirects on success", async () => {
    vi.mocked(deleteSitePoint).mockResolvedValue(undefined);

    await deleteSitePointAction(POINT_ID, null, new FormData());

    expect(deleteSitePoint).toHaveBeenCalledWith(POINT_ID);
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/site-points", "Point supprimé."));
  });

  it("maps a ReferenceDataInUseError to its own message", async () => {
    vi.mocked(deleteSitePoint).mockRejectedValue(
      new ReferenceDataInUseError("Ce point est encore utilisé."),
    );

    const result = await deleteSitePointAction(POINT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Ce point est encore utilisé." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(deleteSitePoint).mockRejectedValue(new Error("boom"));

    const result = await deleteSitePointAction(POINT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la suppression." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
