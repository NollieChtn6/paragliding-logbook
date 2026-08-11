import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { deleteSpotAction } from "./delete-spot";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/spots", () => ({ deleteSpot: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const SPOT_ID = "spot-id";

describe("deleteSpotAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before deleting the spot", async () => {
    vi.mocked(deleteSpot).mockResolvedValue(undefined);

    await deleteSpotAction(SPOT_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls deleteSpot with the spot id and redirects on success", async () => {
    vi.mocked(deleteSpot).mockResolvedValue(undefined);

    await deleteSpotAction(SPOT_ID, null, new FormData());

    expect(deleteSpot).toHaveBeenCalledWith(SPOT_ID);
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/spots", "Spot supprimé."));
  });

  it("maps a ReferenceDataInUseError to its own message", async () => {
    vi.mocked(deleteSpot).mockRejectedValue(
      new ReferenceDataInUseError("Ce spot est encore utilisé."),
    );

    const result = await deleteSpotAction(SPOT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Ce spot est encore utilisé." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(deleteSpot).mockRejectedValue(new Error("boom"));

    const result = await deleteSpotAction(SPOT_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la suppression." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
