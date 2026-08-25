import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { QualificationNotFoundError, updateQualification } from "@/features/qualifications";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { updateQualificationAction } from "./update-qualification";

vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/features/qualifications", () => ({
  updateQualification: vi.fn(),
  QualificationNotFoundError: class QualificationNotFoundError extends Error {},
}));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };
const QUALIFICATION_ID = "some-qualification-id";

describe("updateQualificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls updateQualification with the current user id, the qualification id, and redirects on success", async () => {
    vi.mocked(updateQualification).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("qualificationTypeId", "some-type");

    await updateQualificationAction(QUALIFICATION_ID, null, formData);

    expect(updateQualification).toHaveBeenCalledWith(
      CURRENT_USER.id,
      QUALIFICATION_ID,
      expect.objectContaining({ qualificationTypeId: "some-type" }),
      t.validation.qualification,
    );
    expect(redirect).toHaveBeenCalledWith(
      withToast("/qualifications", t.toast.qualificationUpdated),
    );
  });

  it("maps a ZodError from updateQualification to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateQualification).mockRejectedValue(zodError);

    const result = await updateQualificationAction(QUALIFICATION_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls notFound when the qualification does not belong to the current user", async () => {
    vi.mocked(updateQualification).mockRejectedValue(new QualificationNotFoundError());

    await updateQualificationAction(QUALIFICATION_ID, null, new FormData());

    expect(notFound).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateQualification).mockRejectedValue(new Error("boom"));

    const result = await updateQualificationAction(QUALIFICATION_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.qualificationUpdateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
