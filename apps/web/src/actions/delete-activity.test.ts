import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityNotFoundError, deleteActivity } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { deleteActivityAction } from "./delete-activity";

// Même approche que update-flight.test.ts : deleteActivity et
// requireCurrentUser sont mockés, on ne vérifie ici que le comportement
// propre à l'action (mapping des erreurs, redirect, notFound).
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/features/activities", () => ({
  deleteActivity: vi.fn(),
  ActivityNotFoundError: class ActivityNotFoundError extends Error {},
}));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };
const ACTIVITY_ID = "some-activity-id";

describe("deleteActivityAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls deleteActivity with the current user id and the activity id, and redirects on success", async () => {
    vi.mocked(deleteActivity).mockResolvedValue(undefined);

    await deleteActivityAction(ACTIVITY_ID, null, new FormData());

    expect(deleteActivity).toHaveBeenCalledWith(CURRENT_USER.id, ACTIVITY_ID);
    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.activityDeleted));
  });

  it("calls notFound when the activity does not belong to the current user", async () => {
    vi.mocked(deleteActivity).mockRejectedValue(new ActivityNotFoundError());

    await deleteActivityAction(ACTIVITY_ID, null, new FormData());

    expect(notFound).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(deleteActivity).mockRejectedValue(new Error("boom"));

    const result = await deleteActivityAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.deleteError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
