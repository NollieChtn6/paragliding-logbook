import { describe, expect, it } from "vitest";
import { buildMapMarkers } from "./build-map-markers";

describe("buildMapMarkers", () => {
  it("maps a takeoff site point to a TAKEOFF marker with details and related links", () => {
    const markers = buildMapMarkers(
      [
        {
          id: "point-1",
          label: "Décollage",
          latitude: 45.3,
          longitude: 5.9,
          altitudeM: 900,
          orientationDeg: 180,
          siteId: "site-1",
          site: { name: "Saint-Hilaire-du-Touvet" },
          sitePointType: { code: "TAKEOFF" },
        },
      ],
      [],
    );

    expect(markers).toEqual([
      {
        id: "site-point-point-1",
        kind: "TAKEOFF",
        label: "Décollage",
        latitude: 45.3,
        longitude: 5.9,
        editHref: "/admin/site-points/point-1/edit",
        details: [
          { label: "Site", value: "Saint-Hilaire-du-Touvet" },
          { label: "Altitude", value: "900 m" },
          { label: "Orientation", value: "180°" },
        ],
        relatedLinks: [{ label: "Modifier le site", href: "/admin/sites/site-1/edit" }],
        siblingPoints: [],
      },
    ]);
  });

  it("maps a landing site point to a LANDING marker", () => {
    const markers = buildMapMarkers(
      [
        {
          id: "point-2",
          label: "Atterrissage",
          latitude: 45.3,
          longitude: 5.9,
          altitudeM: 300,
          orientationDeg: null,
          siteId: "site-1",
          site: { name: "Saint-Hilaire-du-Touvet" },
          sitePointType: { code: "LANDING" },
        },
      ],
      [],
    );

    expect(markers[0]?.kind).toBe("LANDING");
    expect(markers[0]?.details).toContainEqual({ label: "Orientation", value: "—" });
  });

  it("lists the other points of the same site as siblingPoints", () => {
    const markers = buildMapMarkers(
      [
        {
          id: "point-takeoff",
          label: "Décollage",
          latitude: 45.3,
          longitude: 5.9,
          altitudeM: 900,
          orientationDeg: null,
          siteId: "site-1",
          site: { name: "Saint-Hilaire-du-Touvet" },
          sitePointType: { code: "TAKEOFF" },
        },
        {
          id: "point-landing",
          label: "Atterrissage",
          latitude: 45.31,
          longitude: 5.91,
          altitudeM: 300,
          orientationDeg: null,
          siteId: "site-1",
          site: { name: "Saint-Hilaire-du-Touvet" },
          sitePointType: { code: "LANDING" },
        },
        {
          id: "point-other-site",
          label: "Décollage ailleurs",
          latitude: 46.1,
          longitude: 6.2,
          altitudeM: 800,
          orientationDeg: null,
          siteId: "site-2",
          site: { name: "Autre site" },
          sitePointType: { code: "TAKEOFF" },
        },
      ],
      [],
    );

    const takeoffMarker = markers.find((marker) => marker.id === "site-point-point-takeoff");
    expect(takeoffMarker?.siblingPoints).toEqual([
      { id: "site-point-point-landing", label: "Atterrissage", kind: "LANDING" },
    ]);
  });

  it("includes a school with coordinates as a SCHOOL marker", () => {
    const markers = buildMapMarkers(
      [],
      [{ id: "school-1", name: "École Test", city: "Annecy", latitude: 45.9, longitude: 6.1 }],
    );

    expect(markers).toEqual([
      {
        id: "school-school-1",
        kind: "SCHOOL",
        label: "École Test",
        latitude: 45.9,
        longitude: 6.1,
        editHref: "/admin/schools/school-1/edit",
        details: [{ label: "Ville", value: "Annecy" }],
        relatedLinks: [],
        siblingPoints: [],
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
    );

    expect(markers).toEqual([]);
  });
});
