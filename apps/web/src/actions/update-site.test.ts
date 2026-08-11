import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { updateSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { updateSiteAction } from "./update-site";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/sites", () => ({ updateSite: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const SITE_ID = "site-id";

describe("updateSiteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before updating the site", async () => {
    vi.mocked(updateSite).mockResolvedValue({} as never);

    await updateSiteAction(SITE_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls updateSite with the site id and submitted data, and redirects on success", async () => {
    vi.mocked(updateSite).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("label", "Site modifié");

    await updateSiteAction(SITE_ID, null, formData);

    expect(updateSite).toHaveBeenCalledWith(
      SITE_ID,
      expect.objectContaining({ label: "Site modifié" }),
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/sites", "Site modifié."));
  });

  it("maps a ZodError from updateSite to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateSite).mockRejectedValue(zodError);

    const result = await updateSiteAction(SITE_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateSite).mockRejectedValue(new Error("boom"));

    const result = await updateSiteAction(SITE_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la modification du site." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
