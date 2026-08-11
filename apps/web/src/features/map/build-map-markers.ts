export type MapMarkerKind = "TAKEOFF" | "LANDING" | "SCHOOL";

export type MapMarkerDetail = { label: string; value: string };
export type MapMarkerLink = { label: string; href: string };
export type MapMarkerSibling = { id: string; label: string; kind: MapMarkerKind };

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  label: string;
  latitude: number;
  longitude: number;
  editHref: string;
  details: MapMarkerDetail[];
  relatedLinks: MapMarkerLink[];
  // Autres points du même site (voir admin-map.tsx) : sélectionner un
  // point sibling doit rouvrir le volet sur ce marqueur et recentrer la
  // carte dessus, pas naviguer vers une autre page — d'où une liste de
  // marqueurs sélectionnables plutôt qu'un simple lien href.
  siblingPoints: MapMarkerSibling[];
};

type SitePointInput = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  altitudeM: number;
  orientationDeg: number | null;
  siteId: string;
  site: { name: string };
  sitePointType: { code: string };
};

type SchoolInput = {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

function sitePointKind(point: { sitePointType: { code: string } }): MapMarkerKind {
  return point.sitePointType.code === "TAKEOFF" ? "TAKEOFF" : "LANDING";
}

// Pas de marqueur "Site" séparé : Site.latitude/longitude ne sont pas
// renseignés en pratique (voir prisma/seed.ts, SiteSeed n'a pas ce champ) —
// seuls les SitePoint ont des coordonnées fiables (champ obligatoire en
// base). L'école n'apparaît que si latitude/longitude sont renseignées
// (issues d'une sélection BAN, voir features/schools/address-combobox.tsx) :
// une école créée avant cette fonctionnalité n'a pas de coordonnées.
//
// relatedLinks reste volontairement limité au référentiel admin (site ↔ ses
// points) : pas de lien vers les stages effectués dans une école, qui
// appartiennent à un utilisateur précis (TrainingCamp.userId via Activity)
// — le compte ADMIN n'est propriétaire d'aucun stage, et /activities/[id]
// refuse déjà l'accès à qui n'en est pas propriétaire (décision explicite,
// pas juste un oubli).
export function buildMapMarkers(sitePoints: SitePointInput[], schools: SchoolInput[]): MapMarker[] {
  const pointMarkers: MapMarker[] = sitePoints.map((point) => ({
    id: `site-point-${point.id}`,
    kind: sitePointKind(point),
    label: point.label,
    latitude: point.latitude,
    longitude: point.longitude,
    editHref: `/admin/site-points/${point.id}/edit`,
    details: [
      { label: "Site", value: point.site.name },
      { label: "Altitude", value: `${point.altitudeM} m` },
      {
        label: "Orientation",
        value: point.orientationDeg !== null ? `${point.orientationDeg}°` : "—",
      },
    ],
    relatedLinks: [{ label: "Modifier le site", href: `/admin/sites/${point.siteId}/edit` }],
    siblingPoints: sitePoints
      .filter((other) => other.siteId === point.siteId && other.id !== point.id)
      .map((other) => ({
        id: `site-point-${other.id}`,
        label: other.label,
        kind: sitePointKind(other),
      })),
  }));

  const schoolMarkers: MapMarker[] = schools
    .filter(
      (school): school is SchoolInput & { latitude: number; longitude: number } =>
        school.latitude !== null && school.longitude !== null,
    )
    .map((school) => ({
      id: `school-${school.id}`,
      kind: "SCHOOL",
      label: school.name,
      latitude: school.latitude,
      longitude: school.longitude,
      editHref: `/admin/schools/${school.id}/edit`,
      details: school.city ? [{ label: "Ville", value: school.city }] : [],
      relatedLinks: [],
      siblingPoints: [],
    }));

  return [...pointMarkers, ...schoolMarkers];
}
