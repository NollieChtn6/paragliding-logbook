import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { createSchoolAction } from "./create-school";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/schools", () => ({ createSchool: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const ADMIN_USER = { id: "admin-id", role: "ADMIN" };

describe("createSchoolAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(ADMIN_USER as never);
  });

  it("requires admin before creating the school", async () => {
    vi.mocked(createSchool).mockResolvedValue({} as never);

    await createSchoolAction(null, new FormData());

    expect(requireAdmin).toHaveBeenCalled();
  });

  it("calls createSchool with the submitted data and redirects on success", async () => {
    vi.mocked(createSchool).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("name", "Nouvelle école");

    await createSchoolAction(null, formData);

    expect(createSchool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nouvelle école" }),
      t.validation.school,
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/admin/schools", t.toast.schoolCreated));
  });

  it("maps a ZodError from createSchool to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createSchool).mockRejectedValue(zodError);

    const result = await createSchoolAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createSchool).mockRejectedValue(new Error("boom"));

    const result = await createSchoolAction(null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.schoolCreateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
