import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateGroundHandlingSession } from "@/features/ground-handling-sessions";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { updateGroundHandlingSessionAction } from "./update-ground-handling-session";

vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/features/ground-handling-sessions", () => ({ updateGroundHandlingSession: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));

const CURRENT_USER = { id: "current-user-id" };
const ACTIVITY_ID = "some-activity-id";

describe("updateGroundHandlingSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls updateGroundHandlingSession with the current user id, the activity id, and redirects on success", async () => {
    vi.mocked(updateGroundHandlingSession).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("siteId", "some-site");

    await updateGroundHandlingSessionAction(ACTIVITY_ID, null, formData);

    expect(updateGroundHandlingSession).toHaveBeenCalledWith(
      CURRENT_USER.id,
      ACTIVITY_ID,
      expect.objectContaining({ siteId: "some-site" }),
    );
    expect(redirect).toHaveBeenCalledWith(
      withToast(`/activities/${ACTIVITY_ID}`, "Séance modifiée."),
    );
  });

  it("maps a ZodError from updateGroundHandlingSession to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateGroundHandlingSession).mockRejectedValue(zodError);

    const result = await updateGroundHandlingSessionAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls notFound when the activity does not belong to the current user", async () => {
    vi.mocked(updateGroundHandlingSession).mockRejectedValue(new ActivityNotFoundError());

    await updateGroundHandlingSessionAction(ACTIVITY_ID, null, new FormData());

    expect(notFound).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateGroundHandlingSession).mockRejectedValue(new Error("boom"));

    const result = await updateGroundHandlingSessionAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({
      success: false,
      error: "Erreur lors de la modification de la séance.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
