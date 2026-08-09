import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { deleteSiteAction } from "./delete-site";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/sites", () => ({ deleteSite: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const SITE_ID = "site-id";

describe("deleteSiteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before deleting the site", async () => {
    vi.mocked(deleteSite).mockResolvedValue(undefined);

    await deleteSiteAction(SITE_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls deleteSite with the site id and redirects on success", async () => {
    vi.mocked(deleteSite).mockResolvedValue(undefined);

    await deleteSiteAction(SITE_ID, null, new FormData());

    expect(deleteSite).toHaveBeenCalledWith(SITE_ID);
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/sites", "Site supprimé."));
  });

  it("maps a ReferenceDataInUseError to its own message", async () => {
    vi.mocked(deleteSite).mockRejectedValue(
      new ReferenceDataInUseError("Ce site est encore utilisé."),
    );

    const result = await deleteSiteAction(SITE_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Ce site est encore utilisé." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(deleteSite).mockRejectedValue(new Error("boom"));

    const result = await deleteSiteAction(SITE_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la suppression." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
