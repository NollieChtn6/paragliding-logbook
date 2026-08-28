import { describe, expect, it } from "vitest";
import {
  getAverageDurationTrend,
  getDistinctSitesCount,
  getFavoriteSite,
  getFlightTypeBreakdown,
  getLatestMonthDelta,
  getLongestFlightDuration,
  toMonthlyValues,
} from "./flight-progression-charts";

describe("getFlightTypeBreakdown", () => {
  it("counts flights per type", () => {
    const flights = [
      { flightTypeCode: "LOCAL" },
      { flightTypeCode: "THERMAL" },
      { flightTypeCode: "LOCAL" },
    ];
    expect(getFlightTypeBreakdown(flights, ["LOCAL", "THERMAL", "SOARING"])).toEqual([
      { code: "LOCAL", count: 2 },
      { code: "THERMAL", count: 1 },
      { code: "SOARING", count: 0 },
    ]);
  });

  it("represents a never-flown type with a zero count rather than omitting it", () => {
    expect(getFlightTypeBreakdown([], ["LOCAL"])).toEqual([{ code: "LOCAL", count: 0 }]);
  });

  it("returned counts sum back to the total flight count", () => {
    const flights = [
      { flightTypeCode: "LOCAL" },
      { flightTypeCode: "THERMAL" },
      { flightTypeCode: "LOCAL" },
      { flightTypeCode: "OTHER" },
    ];
    const breakdown = getFlightTypeBreakdown(flights, ["LOCAL", "THERMAL", "OTHER"]);
    expect(breakdown.reduce((sum, entry) => sum + entry.count, 0)).toBe(flights.length);
  });
});

describe("getDistinctSitesCount", () => {
  it("counts a site once, whether seen as a takeoff or a landing", () => {
    const flights = [
      { takeoffSiteId: "site-a", landingSiteId: "site-b" },
      { takeoffSiteId: "site-b", landingSiteId: "site-c" },
    ];
    expect(getDistinctSitesCount(flights)).toBe(3);
  });

  it("does not double-count a revisited site", () => {
    const flights = [
      { takeoffSiteId: "site-a", landingSiteId: "site-a" },
      { takeoffSiteId: "site-a", landingSiteId: "site-a" },
    ];
    expect(getDistinctSitesCount(flights)).toBe(1);
  });

  it("returns 0 for no flights", () => {
    expect(getDistinctSitesCount([])).toBe(0);
  });
});

describe("getAverageDurationTrend", () => {
  it("averages durations per calendar month", () => {
    const flights = [
      { date: new Date("2025-01-05"), durationMin: 60 },
      { date: new Date("2025-01-20"), durationMin: 30 },
      { date: new Date("2025-03-10"), durationMin: 90 },
    ];
    expect(getAverageDurationTrend(flights)).toEqual([
      { month: "2025-01", averageMinutes: 45 },
      { month: "2025-03", averageMinutes: 90 },
    ]);
  });

  it("omits a month with no flights entirely, rather than a zero or an interpolated point", () => {
    const flights = [
      { date: new Date("2025-01-05"), durationMin: 60 },
      { date: new Date("2025-03-10"), durationMin: 90 },
    ];
    const months = getAverageDurationTrend(flights).map((point) => point.month);
    expect(months).toEqual(["2025-01", "2025-03"]);
    expect(months).not.toContain("2025-02");
  });

  it("returns an empty trend for no flights", () => {
    expect(getAverageDurationTrend([])).toEqual([]);
  });
});

describe("getLatestMonthDelta", () => {
  it("returns the signed difference between the last two points", () => {
    expect(getLatestMonthDelta([5, 8, 12])).toBe(4);
    expect(getLatestMonthDelta([12, 8])).toBe(-4);
  });

  it("returns undefined when there is no previous point to compare against", () => {
    expect(getLatestMonthDelta([5])).toBeUndefined();
    expect(getLatestMonthDelta([])).toBeUndefined();
  });
});

describe("toMonthlyValues", () => {
  it("diffs each point against the previous one, keeping the first point as-is", () => {
    expect(toMonthlyValues([5, 8, 12])).toEqual([5, 3, 4]);
  });

  it("can return a negative value for a quieter month than the previous one", () => {
    expect(toMonthlyValues([5, 12, 8])).toEqual([5, 7, -4]);
  });

  it("returns an empty array for no points", () => {
    expect(toMonthlyValues([])).toEqual([]);
  });
});

describe("getFavoriteSite", () => {
  it("returns the site seen the most often, across takeoffs and landings", () => {
    const flights = [
      { takeoffSite: { id: "a", label: "Site A" }, landingSite: { id: "b", label: "Site B" } },
      { takeoffSite: { id: "a", label: "Site A" }, landingSite: { id: "c", label: "Site C" } },
      { takeoffSite: { id: "b", label: "Site B" }, landingSite: { id: "a", label: "Site A" } },
    ];
    expect(getFavoriteSite(flights)).toEqual({ id: "a", label: "Site A", count: 3 });
  });

  it("breaks a tie by keeping the first site encountered chronologically", () => {
    const flights = [
      { takeoffSite: { id: "a", label: "Site A" }, landingSite: { id: "b", label: "Site B" } },
    ];
    expect(getFavoriteSite(flights)).toEqual({ id: "a", label: "Site A", count: 1 });
  });

  it("returns undefined for no flights", () => {
    expect(getFavoriteSite([])).toBeUndefined();
  });
});

describe("getLongestFlightDuration", () => {
  it("returns the longest duration across all flights", () => {
    const flights = [{ durationMin: 30 }, { durationMin: 90 }, { durationMin: 45 }];
    expect(getLongestFlightDuration(flights)).toBe(90);
  });

  it("returns undefined for no flights", () => {
    expect(getLongestFlightDuration([])).toBeUndefined();
  });
});
