import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createFlight } from "@/features/flights";
import { prisma } from "@/lib/prisma";
import { createFlightAction } from "./create-flight";

// Ne re-teste pas les règles métier Flight (déjà couvertes par
// lib/validations/flight.test.ts et create-flight.service.integration.test.ts) :
// createFlight est mocké, on ne vérifie ici que le comportement propre à
// l'action (résolution de l'utilisateur de dev, mapping des erreurs, redirect).
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/flights", () => ({ createFlight: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

const DEV_USER = { id: "dev-user-id" };

describe("createFlightAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when the development user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await createFlightAction(null, new FormData());

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("prisma:seed"),
    });
    expect(createFlight).not.toHaveBeenCalled();
  });

  it("calls createFlight with the development user id and redirects on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(DEV_USER as never);
    vi.mocked(createFlight).mockResolvedValue({} as never);
    const formData = new FormData();
    formData.set("siteId", "some-site");

    await createFlightAction(null, formData);

    expect(createFlight).toHaveBeenCalledWith(
      DEV_USER.id,
      expect.objectContaining({ siteId: "some-site" }),
    );
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("maps a ZodError from createFlight to a validation error message", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(DEV_USER as never);
    const zodError = z.string().safeParse(123).error;
    if (!zodError) throw new Error("expected a ZodError for this test fixture");
    vi.mocked(createFlight).mockRejectedValue(zodError);

    const result = await createFlightAction(null, new FormData());

    expect(result).toEqual({ success: false, error: zodError.issues[0]?.message });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps an unexpected error to a generic message", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(DEV_USER as never);
    vi.mocked(createFlight).mockRejectedValue(new Error("boom"));

    const result = await createFlightAction(null, new FormData());

    expect(result).toEqual({ success: false, error: "Erreur lors de la création du vol." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
