import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateFlight } from "@/features/flights";
import { requireCurrentUser } from "@/lib/current-user";
import { updateFlightAction } from "./update-flight";

// Même approche que create-flight.test.ts : updateFlight et
// requireCurrentUser sont mockés, on ne vérifie ici que le comportement
// propre à l'action (mapping des erreurs, redirect, notFound).
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/features/flights", () => ({ updateFlight: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));

const CURRENT_USER = { id: "current-user-id" };
const ACTIVITY_ID = "some-activity-id";

describe("updateFlightAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls updateFlight with the current user id, the activity id, and redirects on success", async () => {
    vi.mocked(updateFlight).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("siteId", "some-site");

    await updateFlightAction(ACTIVITY_ID, null, formData);

    expect(updateFlight).toHaveBeenCalledWith(
      CURRENT_USER.id,
      ACTIVITY_ID,
      expect.objectContaining({ siteId: "some-site" }),
    );
    expect(redirect).toHaveBeenCalledWith(`/activities/${ACTIVITY_ID}`);
  });

  it("maps a ZodError from updateFlight to a validation error message", async () => {
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(updateFlight).mockRejectedValue(zodError);

    const result = await updateFlightAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls notFound when the activity does not belong to the current user", async () => {
    vi.mocked(updateFlight).mockRejectedValue(new ActivityNotFoundError());

    await updateFlightAction(ACTIVITY_ID, null, new FormData());

    expect(notFound).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(updateFlight).mockRejectedValue(new Error("boom"));

    const result = await updateFlightAction(ACTIVITY_ID, null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la modification du vol." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
