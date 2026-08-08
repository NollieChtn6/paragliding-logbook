import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { createTrainingCampAction } from "./create-training-camp";

// Ne re-teste pas les règles métier TrainingCamp (déjà couvertes par
// lib/validations/training-camp.test.ts et
// create-training-camp.service.integration.test.ts) ni la résolution de
// session (déjà couverte par lib/current-user.test.ts) : requireCurrentUser
// et createTrainingCamp sont mockés, on ne vérifie ici que le comportement
// propre à l'action (mapping des erreurs, redirect).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/training-camps", () => ({ createTrainingCamp: vi.fn() }));
vi.mock("@/lib/current-user", () => ({ requireCurrentUser: vi.fn() }));

const CURRENT_USER = { id: "current-user-id" };

describe("createTrainingCampAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentUser).mockResolvedValue(CURRENT_USER as never);
  });

  it("calls createTrainingCamp with the current user id and redirects on success", async () => {
    vi.mocked(createTrainingCamp).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("schoolId", "some-school");

    await createTrainingCampAction(null, formData);

    expect(createTrainingCamp).toHaveBeenCalledWith(
      CURRENT_USER.id,
      expect.objectContaining({ schoolId: "some-school" }),
    );
    expect(redirect).toHaveBeenCalledWith("/activities");
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

    expect(result).toEqual({ success: false, error: "Erreur lors de la création du stage." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
