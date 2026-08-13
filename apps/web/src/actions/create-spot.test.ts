import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { createSpotAction } from "./create-spot";

// requireAdmin et createSpot sont mockés (déjà couverts par
// lib/current-user.test.ts et create-spot.service.integration.test.ts) : on
// ne vérifie ici que le comportement propre à l'action.
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/spots", () => ({ createSpot: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const ADMIN_USER = { id: "admin-id", role: "ADMIN" };

describe("createSpotAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before creating the spot", async () => {
    vi.mocked(createSpot).mockResolvedValue({} as never);

    await createSpotAction(null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls createSpot with the submitted data and redirects on success", async () => {
    vi.mocked(createSpot).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("name", "Nouveau spot");

    await createSpotAction(null, formData);

    expect(createSpot).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nouveau spot" }),
      t.validation.spot,
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/spots", t.toast.spotCreated));
  });

  it("maps a ZodError from createSpot to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createSpot).mockRejectedValue(zodError);

    const result = await createSpotAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createSpot).mockRejectedValue(new Error("boom"));

    const result = await createSpotAction(null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.spotCreateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
