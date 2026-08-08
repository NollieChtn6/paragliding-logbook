import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createFlight } from "@/features/flights";
import { requireCurrentUser } from "@/lib/current-user";
import { createFlightAction } from "./create-flight";

// Ne re-teste pas les règles métier Flight (déjà couvertes par
// lib/validations/flight.test.ts et create-flight.service.integration.test.ts)
// ni la résolution de session (déjà couverte par lib/current-user.test.ts) :
// requireCurrentUser et createFlight sont mockés, on ne vérifie ici que le
// comportement propre à l'action (mapping des erreurs, redirect).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/flights", () => ({ createFlight: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));

const CURRENT_USER = { id: "current-user-id" };

describe("createFlightAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls createFlight with the current user id and redirects on success", async () => {
    vi.mocked(createFlight).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("siteId", "some-site");

    await createFlightAction(null, formData);

    expect(createFlight).toHaveBeenCalledWith(
      CURRENT_USER.id,
      expect.objectContaining({ siteId: "some-site" }),
    );
    expect(redirect).toHaveBeenCalledWith("/activities");
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

    expect(result).toEqual({ success: false, error: "Erreur lors de la création du vol." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
