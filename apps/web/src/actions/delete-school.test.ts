import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { deleteSchoolAction } from "./delete-school";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/schools", () => ({ deleteSchool: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const SCHOOL_ID = "school-id";

describe("deleteSchoolAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before deleting the school", async () => {
    vi.mocked(deleteSchool).mockResolvedValue(undefined);

    await deleteSchoolAction(SCHOOL_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls deleteSchool with the school id and redirects on success", async () => {
    vi.mocked(deleteSchool).mockResolvedValue(undefined);

    await deleteSchoolAction(SCHOOL_ID, null, new FormData());

    expect(deleteSchool).toHaveBeenCalledWith(SCHOOL_ID);
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/schools", "École supprimée."));
  });

  it("maps a ReferenceDataInUseError to its own message", async () => {
    vi.mocked(deleteSchool).mockRejectedValue(
      new ReferenceDataInUseError("Cette école est encore utilisée."),
    );

    const result = await deleteSchoolAction(SCHOOL_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Cette école est encore utilisée." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(deleteSchool).mockRejectedValue(new Error("boom"));

    const result = await deleteSchoolAction(SCHOOL_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la suppression." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
