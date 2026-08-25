import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteQualification } from "@/features/qualifications";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { deleteQualificationAction } from "./delete-qualification";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/qualifications", () => ({ deleteQualification: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };
const QUALIFICATION_ID = "some-qualification-id";

describe("deleteQualificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls deleteQualification with the current user id and the qualification id, and redirects on success", async () => {
    vi.mocked(deleteQualification).mockResolvedValue(undefined);

    await deleteQualificationAction(QUALIFICATION_ID, null, new FormData());

    expect(deleteQualification).toHaveBeenCalledWith(CURRENT_USER.id, QUALIFICATION_ID);
    expect(redirect).toHaveBeenCalledWith(
      withToast("/qualifications", t.toast.qualificationDeleted),
    );
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(deleteQualification).mockRejectedValue(new Error("boom"));

    const result = await deleteQualificationAction(QUALIFICATION_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.deleteError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
