import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { countActivities, getActivityMilestone } from "@/features/activities";
import { createGroundHandlingSession } from "@/features/ground-handling-sessions";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { createGroundHandlingSessionAction } from "./create-ground-handling-session";

// Ne re-teste pas les règles métier GroundHandlingSession (déjà couvertes par
// lib/validations/ground-handling.test.ts et
// create-ground-handling-session.service.integration.test.ts) ni la
// résolution de session (déjà couverte par lib/current-user.test.ts) :
// requireCurrentUser et createGroundHandlingSession sont mockés, on ne
// vérifie ici que le comportement propre à l'action (mapping des erreurs,
// redirect, choix du message de palier — la logique elle-même est couverte
// par features/activities/activity-milestone.test.ts).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/ground-handling-sessions", () => ({
  createGroundHandlingSession: vi.fn(),
}));
vi.mock("@/features/activities", () => ({
  countActivities: vi.fn(),
  getActivityMilestone: vi.fn(),
}));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };

describe("createGroundHandlingSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
    vi.mocked(countActivities).mockResolvedValue(1);
    vi.mocked(getActivityMilestone).mockReturnValue(null);
  });

  it("calls createGroundHandlingSession with the current user id and redirects on success", async () => {
    vi.mocked(createGroundHandlingSession).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("siteId", "some-site");

    await createGroundHandlingSessionAction(null, formData);

    expect(createGroundHandlingSession).toHaveBeenCalledWith(
      CURRENT_USER.id,
      expect.objectContaining({ siteId: "some-site" }),
      t.validation.groundHandling,
    );
    expect(redirect).toHaveBeenCalledWith(
      withToast("/activities", t.toast.groundHandlingSessionCreated),
    );
  });

  it("redirects with the first-activity milestone message when it is the user's first activity", async () => {
    vi.mocked(createGroundHandlingSession).mockResolvedValue({} as never);
    vi.mocked(getActivityMilestone).mockReturnValue({ kind: "first-activity" });

    await createGroundHandlingSessionAction(null, new FormData());

    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.firstActivityCreated));
  });

  it("maps a ZodError from createGroundHandlingSession to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createGroundHandlingSession).mockRejectedValue(zodError);

    const result = await createGroundHandlingSessionAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createGroundHandlingSession).mockRejectedValue(new Error("boom"));

    const result = await createGroundHandlingSessionAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: t.toast.groundHandlingSessionCreateError,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
