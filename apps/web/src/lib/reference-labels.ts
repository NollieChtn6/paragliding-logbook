// Libellés affichés pour les tables de référence (ActivityType, SitePointType,
// FlightType) — voir docs/decisions/003-reference-table-codes.md. Ces tables
// ne stockent que des `code` stables : ce sont des catégories techniques
// traduisibles, à distinguer des données métier éditoriales (Site.name,
// SitePoint.label, School.name) qui restent en base.
//
// Un seul fichier, ~15 entrées au total : à éclater par domaine si le volume
// grossit vraiment. Un Record plat (pas encore de vraie i18n, une seule
// langue servie aujourd'hui) : le jour où plusieurs langues sont
// nécessaires, chaque Record ci-dessous devient directement l'entrée "fr" du
// catalogue de messages choisi, sans changement de schéma — voir la
// convention de clé proposée dans l'ADR (ex. `flightTypes.CROSS_COUNTRY`).

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  FLIGHT: "Vol",
  TRAINING_CAMP: "Stage",
  GROUND_HANDLING: "Gonflage",
};

export const SITE_POINT_TYPE_LABELS: Record<string, string> = {
  TAKEOFF: "Décollage",
  LANDING: "Atterrissage",
};

export const FLIGHT_TYPE_LABELS: Record<string, string> = {
  LOCAL: "Local",
  CROSS_COUNTRY: "Vol de distance",
  SOARING: "Vol de pente",
  THERMAL: "Vol thermique",
  TRAINING: "Entraînement",
  OTHER: "Autre",
};

export const TRAINING_CAMP_TYPE_LABELS: Record<string, string> = {
  INIT: "Initiation",
  PROGRESSION: "Progression",
  THERMAL: "Thermique",
  SIV: "SIV",
};
