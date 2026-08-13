import { describe, expect, it } from "vitest";
import { getDictionary } from "@/messages";
import { buildMapMarkers } from "./build-map-markers";

describe.each(["fr-FR", "en-GB"] as const)("buildMapMarkers (%s)", (locale) => {
  const t = getDictionary(locale).admin;

  it("maps a takeoff site to a TAKEOFF marker with details and related links", () => {
    const markers = buildMapMarkers(
      [
        {
          id: "site-1",
          label: "Décollage",
          latitude: 45.3,
          longitude: 5.9,
          altitudeM: 900,
          orientationDeg: 180,
          spotId: "spot-1",
          spot: { name: "Saint-Hilaire-du-Touvet" },
          siteType: { code: "TAKEOFF" },
        },
      ],
      [],
      t,
    );

    expect(markers).toEqual([
      {
        id: "site-site-1",
        kind: "TAKEOFF",
        label: "Décollage",
        latitude: 45.3,
        longitude: 5.9,
        editHref: "/admin/sites/site-1/edit",
        details: [
          { label: t.markerSpotLabel, value: "Saint-Hilaire-du-Touvet" },
          { label: t.markerAltitudeLabel, value: "900 m" },
          { label: t.markerOrientationLabel, value: "180°" },
        ],
        relatedLinks: [{ label: t.markerEditSpotLink, href: "/admin/spots/spot-1/edit" }],
        siblingSites: [],
      },
    ]);
  });

  it("maps a landing site to a LANDING marker", () => {
    const markers = buildMapMarkers(
      [
        {
          id: "site-2",
          label: "Atterrissage",
          latitude: 45.3,
          longitude: 5.9,
          altitudeM: 300,
          orientationDeg: null,
          spotId: "spot-1",
          spot: { name: "Saint-Hilaire-du-Touvet" },
          siteType: { code: "LANDING" },
        },
      ],
      [],
      t,
    );

    expect(markers[0]?.kind).toBe("LANDING");
    expect(markers[0]?.details).toContainEqual({
      label: t.markerOrientationLabel,
      value: t.markerNoValue,
    });
  });

  it("lists the other sites of the same spot as siblingSites", () => {
    const markers = buildMapMarkers(
      [
        {
          id: "site-takeoff",
          label: "Décollage",
          latitude: 45.3,
          longitude: 5.9,
          altitudeM: 900,
          orientationDeg: null,
          spotId: "spot-1",
          spot: { name: "Saint-Hilaire-du-Touvet" },
          siteType: { code: "TAKEOFF" },
        },
        {
          id: "site-landing",
          label: "Atterrissage",
          latitude: 45.31,
          longitude: 5.91,
          altitudeM: 300,
          orientationDeg: null,
          spotId: "spot-1",
          spot: { name: "Saint-Hilaire-du-Touvet" },
          siteType: { code: "LANDING" },
        },
        {
          id: "site-other-spot",
          label: "Décollage ailleurs",
          latitude: 46.1,
          longitude: 6.2,
          altitudeM: 800,
          orientationDeg: null,
          spotId: "spot-2",
          spot: { name: "Autre spot" },
          siteType: { code: "TAKEOFF" },
        },
      ],
      [],
      t,
    );

    const takeoffMarker = markers.find((marker) => marker.id === "site-site-takeoff");
    expect(takeoffMarker?.siblingSites).toEqual([
      { id: "site-site-landing", label: "Atterrissage", kind: "LANDING" },
    ]);
  });

  it("includes a school with coordinates as a SCHOOL marker", () => {
    const markers = buildMapMarkers(
      [],
      [{ id: "school-1", name: "École Test", city: "Annecy", latitude: 45.9, longitude: 6.1 }],
      t,
    );

    expect(markers).toEqual([
      {
        id: "school-school-1",
        kind: "SCHOOL",
        label: "École Test",
        latitude: 45.9,
        longitude: 6.1,
        editHref: "/admin/schools/school-1/edit",
        details: [{ label: t.markerCityLabel, value: "Annecy" }],
        relatedLinks: [],
        siblingSites: [],
      },
    ]);
  });

  it("skips a school without coordinates", () => {
    const markers = buildMapMarkers(
      [],
      [
        {
          id: "school-1",
          name: "École sans coordonnées",
          city: "Annecy",
          latitude: null,
          longitude: null,
        },
      ],
      t,
    );

    expect(markers).toEqual([]);
  });
});
