import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { getMilestoneToastMessage } from "./milestone-message";

const t = getDictionary("fr-FR").toast;

describe("getMilestoneToastMessage", () => {
  it("returns the first-activity message", () => {
    expect(getMilestoneToastMessage({ kind: "first-activity" }, t)).toBe(
      "Première activité enregistrée. Bienvenue dans votre carnet.",
    );
  });

  it("composes a flight-count message with the crossed count", () => {
    expect(getMilestoneToastMessage({ kind: "flight-count", count: 100 }, t)).toBe(
      "100 vols enregistrés.",
    );
  });

  it("composes a flight-hours message with the crossed hour count", () => {
    expect(getMilestoneToastMessage({ kind: "flight-hours", hours: 50 }, t)).toBe(
      "50 heures de vol au total.",
    );
  });
});
