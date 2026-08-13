import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { updateTrainingCampAction } from "./update-training-camp";

vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/features/training-camps", () => ({ updateTrainingCamp: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };
const ACTIVITY_ID = "some-activity-id";

describe("updateTrainingCampAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls updateTrainingCamp with the current user id, the activity id, and redirects on success", async () => {
    vi.mocked(updateTrainingCamp).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("schoolId", "some-school");

    await updateTrainingCampAction(ACTIVITY_ID, null, formData);

    expect(updateTrainingCamp).toHaveBeenCalledWith(
      CURRENT_USER.id,
      ACTIVITY_ID,
      expect.objectContaining({ schoolId: "some-school" }),
      t.validation.trainingCamp,
    );
    expect(redirect).toHaveBeenCalledWith(
      withToast(`/activities/${ACTIVITY_ID}`, t.toast.trainingCampUpdated),
    );
  });

  it("maps a ZodError from updateTrainingCamp to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateTrainingCamp).mockRejectedValue(zodError);

    const result = await updateTrainingCampAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls notFound when the activity does not belong to the current user", async () => {
    vi.mocked(updateTrainingCamp).mockRejectedValue(new ActivityNotFoundError());

    await updateTrainingCampAction(ACTIVITY_ID, null, new FormData());

    expect(notFound).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateTrainingCamp).mockRejectedValue(new Error("boom"));

    const result = await updateTrainingCampAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.trainingCampUpdateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
