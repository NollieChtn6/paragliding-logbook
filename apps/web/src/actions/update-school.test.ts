import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { updateSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { updateSchoolAction } from "./update-school";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/schools", () => ({ updateSchool: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));

const ADMIN_USER = { id: "admin-id", role: "ADMIN" };
const SCHOOL_ID = "school-id";

describe("updateSchoolAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before updating the school", async () => {
    vi.mocked(updateSchool).mockResolvedValue({} as never);

    await updateSchoolAction(SCHOOL_ID, null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls updateSchool with the school id and submitted data, and redirects on success", async () => {
    vi.mocked(updateSchool).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("name", "École modifiée");

    await updateSchoolAction(SCHOOL_ID, null, formData);

    expect(updateSchool).toHaveBeenCalledWith(
      SCHOOL_ID,
      expect.objectContaining({ name: "École modifiée" }),
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/schools", "École modifiée."));
  });

  it("maps a ZodError from updateSchool to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateSchool).mockRejectedValue(zodError);

    const result = await updateSchoolAction(SCHOOL_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateSchool).mockRejectedValue(new Error("boom"));

    const result = await updateSchoolAction(SCHOOL_ID, null, new FormData());

    expect(result).toEqual({
      success: false,
      error: "Erreur lors de la modification de l'école.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
