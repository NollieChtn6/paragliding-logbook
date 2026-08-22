import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { countActivities, getActivityMilestone } from "@/features/activities";
import { createTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { createTrainingCampAction } from "./create-training-camp";

// Ne re-teste pas les règles métier TrainingCamp (déjà couvertes par
// lib/validations/training-camp.test.ts et
// create-training-camp.service.integration.test.ts) ni la résolution de
// session (déjà couverte par lib/current-user.test.ts) : requireCurrentUser
// et createTrainingCamp sont mockés, on ne vérifie ici que le comportement
// propre à l'action (mapping des erreurs, redirect, choix du message de
// palier — la logique elle-même est couverte par
// features/activities/activity-milestone.test.ts).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/training-camps", () => ({ createTrainingCamp: vi.fn() }));
vi.mock("@/features/activities", () => ({
  countActivities: vi.fn(),
  getActivityMilestone: vi.fn(),
}));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };

describe("createTrainingCampAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
    vi.mocked(countActivities).mockResolvedValue(1);
    vi.mocked(getActivityMilestone).mockReturnValue(null);
  });

  it("calls createTrainingCamp with the current user id and redirects on success", async () => {
    vi.mocked(createTrainingCamp).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("schoolId", "some-school");

    await createTrainingCampAction(null, formData);

    expect(createTrainingCamp).toHaveBeenCalledWith(
      CURRENT_USER.id,
      expect.objectContaining({ schoolId: "some-school" }),
      t.validation.trainingCamp,
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.trainingCampCreated));
  });

  it("redirects with the first-activity milestone message when it is the user's first activity", async () => {
    vi.mocked(createTrainingCamp).mockResolvedValue({} as never);
    vi.mocked(getActivityMilestone).mockReturnValue({ kind: "first-activity" });

    await createTrainingCampAction(null, new FormData());

    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.firstActivityCreated));
  });

  it("maps a ZodError from createTrainingCamp to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createTrainingCamp).mockRejectedValue(zodError);

    const result = await createTrainingCampAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createTrainingCamp).mockRejectedValue(new Error("boom"));

    const result = await createTrainingCampAction(null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.trainingCampCreateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
