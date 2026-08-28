import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createQualification } from "@/features/qualifications";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { createQualificationAction } from "./create-qualification";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/qualifications", () => ({ createQualification: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };

describe("createQualificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls createQualification with the current user id and redirects on success", async () => {
    vi.mocked(createQualification).mockResolvedValue({
      qualificationType: { code: "PILOT" },
    } as never);
    const formData = new FormData();
    formData.set("qualificationTypeId", "some-type");

    await createQualificationAction(null, formData);

    expect(createQualification).toHaveBeenCalledWith(
      CURRENT_USER.id,
      expect.objectContaining({ qualificationTypeId: "some-type" }),
      t.validation.qualification,
    );
    expect(redirect).toHaveBeenCalledWith(
      withToast(
        "/qualifications",
        t.toast.qualificationCreated(t.referenceLabels.qualificationType.PILOT),
      ),
    );
  });

  it("maps a ZodError from createQualification to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createQualification).mockRejectedValue(zodError);

    const result = await createQualificationAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createQualification).mockRejectedValue(new Error("boom"));

    const result = await createQualificationAction(null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.qualificationCreateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
