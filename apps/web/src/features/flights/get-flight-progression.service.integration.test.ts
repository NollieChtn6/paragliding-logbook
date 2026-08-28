import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createFlight } from "./create-flight.service";
import { getFlightProgression } from "./get-flight-progression.service";

const t = getDictionary("fr-FR").validation.flight;

let userId: string;
let siteAId: string;
let siteBId: string;
let siteCId: string;
let siteDId: string;
let localFlightTypeId: string;
let thermalFlightTypeId: string;
let totalFlightTypeCount: number;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, takeoffType, landingType, localType, thermalType, spot] = await Promise.all([
    prisma.user.create({
      data: {
        email: `flight-progression-${suffix}@paragliding-logbook.local`,
        name: "Flight Progression Test User",
      },
    }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "THERMAL" } }),
    prisma.spot.create({ data: { name: `Flight Progression Test Spot ${suffix}` } }),
  ]);
  userId = user.id;
  localFlightTypeId = localType.id;
  thermalFlightTypeId = thermalType.id;
  totalFlightTypeCount = await prisma.flightType.count();

  const [siteA, siteB, siteC, siteD] = await Promise.all([
    prisma.site.create({
      data: {
        label: "Site A",
        spotId: spot.id,
        siteTypeId: takeoffType.id,
        latitude: 45.9,
        longitude: 6.9,
        altitudeM: 1200,
      },
    }),
    prisma.site.create({
      data: {
        label: "Site B",
        spotId: spot.id,
        siteTypeId: landingType.id,
        latitude: 45.8,
        longitude: 6.8,
        altitudeM: 450,
      },
    }),
    prisma.site.create({
      data: {
        label: "Site C",
        spotId: spot.id,
        siteTypeId: landingType.id,
        latitude: 45.7,
        longitude: 6.7,
        altitudeM: 400,
      },
    }),
    prisma.site.create({
      data: {
        label: "Site D",
        spotId: spot.id,
        siteTypeId: takeoffType.id,
        latitude: 45.6,
        longitude: 6.6,
        altitudeM: 1500,
      },
    }),
  ]);
  siteAId = siteA.id;
  siteBId = siteB.id;
  siteCId = siteC.id;
  siteDId = siteD.id;

  // Deux vols LOCAL en janvier (A->B puis A->B à nouveau, aucun site
  // nouveau), un vol THERMAL en février (D->C, tous deux jamais vus) : de
  // quoi exercer répartition par type, total de sites distincts (4 : A/B/C/D,
  // B et A jamais recomptés) et durée moyenne (non cumulative, distincte par
  // mois).
  await createFlight(
    userId,
    {
      date: "2025-01-05",
      time: "10:00",
      durationMin: "60",
      takeoffPointId: siteAId,
      landingPointId: siteBId,
      flightTypeId: localFlightTypeId,
      observations: "Flight 1.",
      improvementPoints: "None.",
    },
    t,
  );
  await createFlight(
    userId,
    {
      date: "2025-01-20",
      time: "11:00",
      durationMin: "30",
      takeoffPointId: siteAId,
      landingPointId: siteBId,
      flightTypeId: localFlightTypeId,
      observations: "Flight 2.",
      improvementPoints: "None.",
    },
    t,
  );
  await createFlight(
    userId,
    {
      date: "2025-02-10",
      time: "12:00",
      durationMin: "90",
      takeoffPointId: siteDId,
      landingPointId: siteCId,
      flightTypeId: thermalFlightTypeId,
      observations: "Flight 3.",
      improvementPoints: "None.",
    },
    t,
  );
});

afterAll(async () => {
  const spotIds = await prisma.site
    .findMany({
      where: { id: { in: [siteAId, siteBId, siteCId, siteDId] } },
      select: { spotId: true },
    })
    .then((sites) => [...new Set(sites.map((site) => site.spotId))]);

  await prisma.flight.deleteMany({ where: { activity: { userId } } });
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.site.deleteMany({ where: { id: { in: [siteAId, siteBId, siteCId, siteDId] } } });
  await prisma.spot.deleteMany({ where: { id: { in: spotIds } } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("getFlightProgression (integration)", () => {
  it("returns the total flight count and the cumulative monthly trend", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.flightCount).toBe(3);
    expect(progression.trend).toEqual([
      { month: "2025-01", cumulativeCount: 2, cumulativeHours: 1.5 },
      { month: "2025-02", cumulativeCount: 3, cumulativeHours: 3 },
    ]);
  });

  it("returns the month-over-month delta for the flight-count and flight-hours trends", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.flightCountDelta).toBe(1);
    expect(progression.flightHoursDelta).toBe(1.5);
  });

  it("returns a flight-type breakdown covering every referenced flight type, including untouched ones", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.flightTypeBreakdown).toHaveLength(totalFlightTypeCount);
    expect(progression.flightTypeBreakdown).toContainEqual({ code: "LOCAL", count: 2 });
    expect(progression.flightTypeBreakdown).toContainEqual({ code: "THERMAL", count: 1 });
    expect(progression.flightTypeBreakdown.reduce((sum, entry) => sum + entry.count, 0)).toBe(3);
  });

  it("returns the total distinct-sites count, counting a site once across takeoff/landing", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.sitesCount).toBe(4);
  });

  it("returns the favorite site (most flown, takeoff and landing combined)", async () => {
    const progression = await getFlightProgression(userId);

    // Site A : décollage des deux vols LOCAL de janvier (2 apparitions).
    // Site B : atterrissage des mêmes deux vols (2 apparitions aussi) —
    // égalité tranchée par l'ordre chronologique, A rencontré en premier.
    expect(progression.favoriteSite).toEqual({ id: siteAId, label: "Site A", count: 2 });
  });

  it("returns the longest flight duration across all flights", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.longestFlightDuration).toBe(90);
  });

  it("returns the non-cumulative average-duration-per-month trend", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.averageDurationTrend).toEqual([
      { month: "2025-01", averageMinutes: 45 },
      { month: "2025-02", averageMinutes: 90 },
    ]);
  });

  it("returns the month-over-month delta for the average-duration trend", async () => {
    const progression = await getFlightProgression(userId);

    expect(progression.averageDurationDelta).toBe(45);
  });
});
