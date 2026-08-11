import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { createSiteAction } from "./create-site";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/sites", () => ({ createSite: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };

describe("createSiteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before creating the site", async () => {
    vi.mocked(createSite).mockResolvedValue({} as never);

    await createSiteAction(null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls createSite with the submitted data and redirects on success", async () => {
    vi.mocked(createSite).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("label", "Nouveau site");

    await createSiteAction(null, formData);

    expect(createSite).toHaveBeenCalledWith(expect.objectContaining({ label: "Nouveau site" }));
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/sites", "Site créé."));
  });

  it("maps a ZodError from createSite to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createSite).mockRejectedValue(zodError);

    const result = await createSiteAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createSite).mockRejectedValue(new Error("boom"));

    const result = await createSiteAction(null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la création du site." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
