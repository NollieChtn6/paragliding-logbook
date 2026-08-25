import { describe, expect, it } from "vitest";
import { getFlightMilestoneHistory, getFlightProgressionTrend } from "./flight-milestone-history";

describe("getFlightMilestoneHistory", () => {
  it("returns an empty history when no threshold is ever crossed", () => {
    const flights = [{ date: new Date("2025-01-01"), durationMin: 30 }];
    expect(getFlightMilestoneHistory(flights)).toEqual([]);
  });

  it("attributes the 10th flight to the flight-count milestone", () => {
    const flights = Array.from({ length: 10 }, (_, index) => ({
      date: new Date(2025, 0, index + 1),
      durationMin: 30,
    }));
    const history = getFlightMilestoneHistory(flights);
    expect(history).toEqual([
      { milestone: { kind: "flight-count", count: 10 }, date: new Date(2025, 0, 10) },
    ]);
  });

  it("attributes every skipped threshold to the single flight that crosses them, unlike the toast (highest only)", () => {
    // Un vol de 20h fait passer de 5h à 25h : contrairement au toast (qui ne
    // signale que 25h), l'historique doit conserver 10h ET 25h.
    const flights = [
      { date: new Date("2025-01-01"), durationMin: 300 }, // 5h
      { date: new Date("2025-06-01"), durationMin: 1200 }, // +20h = 25h
    ];
    const history = getFlightMilestoneHistory(flights);
    expect(history).toEqual([
      { milestone: { kind: "flight-hours", hours: 10 }, date: new Date("2025-06-01") },
      { milestone: { kind: "flight-hours", hours: 25 }, date: new Date("2025-06-01") },
    ]);
  });

  it("sorts input chronologically regardless of input order", () => {
    const flights = [
      { date: new Date("2025-06-01"), durationMin: 300 },
      { date: new Date("2025-01-01"), durationMin: 300 },
    ];
    // Les deux ordres doivent produire le même résultat : le tri interne
    // ignore l'ordre d'entrée.
    expect(getFlightMilestoneHistory(flights)).toEqual(
      getFlightMilestoneHistory([...flights].reverse()),
    );
  });
});

describe("getFlightProgressionTrend", () => {
  it("returns one point per calendar month with cumulative values", () => {
    const flights = [
      { date: new Date("2025-01-05"), durationMin: 60 },
      { date: new Date("2025-01-20"), durationMin: 30 },
      { date: new Date("2025-02-10"), durationMin: 90 },
    ];
    expect(getFlightProgressionTrend(flights)).toEqual([
      { month: "2025-01", cumulativeCount: 2, cumulativeHours: 1.5 },
      { month: "2025-02", cumulativeCount: 3, cumulativeHours: 3 },
    ]);
  });

  it("returns an empty trend for no flights", () => {
    expect(getFlightProgressionTrend([])).toEqual([]);
  });
});
