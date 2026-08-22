import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { countActivities, getActivityMilestone } from "@/features/activities";
import { createFlight, getFlightMilestone, getFlightTotals } from "@/features/flights";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";
import { createFlightAction } from "./create-flight";

// Ne re-teste pas les règles métier Flight (déjà couvertes par
// lib/validations/flight.test.ts et create-flight.service.integration.test.ts)
// ni la résolution de session (déjà couverte par lib/current-user.test.ts) :
// requireCurrentUser et createFlight sont mockés, on ne vérifie ici que le
// comportement propre à l'action (mapping des erreurs, redirect, choix du
// message de palier — la logique des paliers elle-même est couverte par
// features/activities/activity-milestone.test.ts et
// features/flights/flight-milestone.test.ts).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/flights", () => ({
  createFlight: vi.fn(),
  getFlightMilestone: vi.fn(),
  getFlightTotals: vi.fn(),
}));
vi.mock("@/features/activities", () => ({
  countActivities: vi.fn(),
  getActivityMilestone: vi.fn(),
}));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));
vi.mock("@/lib/i18n/get-locale", () => ({ getLocale: vi.fn().mockResolvedValue("fr-FR") }));

const t = getDictionary("fr-FR");
const CURRENT_USER = { id: "current-user-id" };

describe("createFlightAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
    vi.mocked(countActivities).mockResolvedValue(1);
    vi.mocked(getFlightTotals).mockResolvedValue({ count: 1, totalMinutes: 60 });
    vi.mocked(getActivityMilestone).mockReturnValue(null);
    vi.mocked(getFlightMilestone).mockReturnValue(null);
  });

  it("calls createFlight with the current user id and redirects on success", async () => {
    vi.mocked(createFlight).mockResolvedValue({ durationMin: 45 } as never);
    const formData = new FormData();
    formData.set("takeoffPointId", "some-point");

    await createFlightAction(null, formData);

    expect(createFlight).toHaveBeenCalledWith(
      CURRENT_USER.id,
      expect.objectContaining({ takeoffPointId: "some-point" }),
      t.validation.flight,
    );
    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.flightCreated));
  });

  it("redirects with the milestone message when a milestone is reached", async () => {
    vi.mocked(createFlight).mockResolvedValue({ durationMin: 45 } as never);
    vi.mocked(getFlightMilestone).mockReturnValue({ kind: "flight-count", count: 10 });

    await createFlightAction(null, new FormData());

    expect(redirect).toHaveBeenCalledWith(withToast("/activities", "10 vols enregistrés."));
  });

  it("prioritizes the first-activity milestone over a flight milestone", async () => {
    vi.mocked(createFlight).mockResolvedValue({ durationMin: 45 } as never);
    vi.mocked(getActivityMilestone).mockReturnValue({ kind: "first-activity" });
    vi.mocked(getFlightMilestone).mockReturnValue({ kind: "flight-count", count: 10 });

    await createFlightAction(null, new FormData());

    expect(redirect).toHaveBeenCalledWith(withToast("/activities", t.toast.firstActivityCreated));
  });

  it("maps a ZodError from createFlight to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createFlight).mockRejectedValue(zodError);

    const result = await createFlightAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(createFlight).mockRejectedValue(new Error("boom"));

    const result = await createFlightAction(null, new FormData());

    expect(result).toEqual({ success: false, error: t.toast.flightCreateError });
    expect(redirect).not.toHaveBeenCalled();
  });
});
