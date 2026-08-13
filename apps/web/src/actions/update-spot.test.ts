import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { updateSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { updateSpotAction } from "./update-spot";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/spots", () => ({ updateSpot: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const SPOT_ID = "spot-id";

describe("updateSpotAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before updating the spot", async () => {
    vi.mocked(updateSpot).mockResolvedValue({} as never);

    await updateSpotAction(SPOT_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls updateSpot with the spot id and submitted data, and redirects on success", async () => {
    vi.mocked(updateSpot).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("name", "Spot modifié");

    await updateSpotAction(SPOT_ID, null, formData);

    expect(updateSpot).toHaveBeenCalledWith(
      SPOT_ID,
      expect.objectContaining({ name: "Spot modifié" }),
      t.validation.spot,
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/spots", t.toast.spotUpdated));
  });

  it("maps a ZodError from updateSpot to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateSpot).mockRejectedValue(zodError);

    const result = await updateSpotAction(SPOT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateSpot).mockRejectedValue(new Error("boom"));

    const result = await updateSpotAction(SPOT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.spotUpdateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
