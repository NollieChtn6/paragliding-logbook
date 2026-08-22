import { describe, expect, it } from "vitest";
import { getFlightMilestone } from "./flight-milestone";

describe("getFlightMilestone", () => {
  it("returns null when no threshold is crossed", () => {
    expect(getFlightMilestone(3, 300, 60)).toBeNull();
  });

  it("returns a flight-count milestone when the new flight crosses a round count", () => {
    expect(getFlightMilestone(9, 900, 60)).toEqual({ kind: "flight-count", count: 10 });
  });

  it("does not re-trigger a count milestone already passed", () => {
    expect(getFlightMilestone(10, 1000, 60)).toBeNull();
  });

  it("returns a flight-hours milestone when total airtime crosses a round hour count", () => {
    // 9h50 (590 min) + 20 min = 610 min = 10h10 -> crosses the 10h mark.
    expect(getFlightMilestone(50, 590, 20)).toEqual({ kind: "flight-hours", hours: 10 });
  });

  it("prefers the count milestone when both are crossed by the same flight", () => {
    // 9 vols / 590 min -> ce vol amène à la fois le 10e vol et la 10e heure.
    expect(getFlightMilestone(9, 590, 20)).toEqual({ kind: "flight-count", count: 10 });
  });

  it("jumps straight to the next unmet threshold when a single flight skips one", () => {
    // Un vol de 20h fait passer directement de 5h à 25h : le palier 10h est
    // sauté, seul 25h doit être signalé (pas de rattrapage rétroactif).
    expect(getFlightMilestone(20, 300, 1200)).toEqual({ kind: "flight-hours", hours: 25 });
  });
});
