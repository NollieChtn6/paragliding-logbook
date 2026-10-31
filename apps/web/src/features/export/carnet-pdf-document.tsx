import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type * as React from "react";
import { getActivitySummary } from "@/features/activities";
import { formatDate } from "@/lib/format-date";
import { formatDurationMinutes } from "@/lib/format-duration";
import { PDF_COLORS } from "@/lib/pdf/colors";
import { PDF_FONT_FAMILY, PDF_SERIF_FONT_FAMILY, registerPdfFonts } from "@/lib/pdf/fonts";
import { getDictionary } from "@/messages";
import type { CarnetExportData } from "./get-carnet-export-data.service";

// Toujours en français, indépendamment de la locale de l'utilisateur
// connecté (ADR 013, "document copy is French") : lecture directe du
// dictionnaire fr-FR, jamais de getDictionary(locale) côté PDF.
const t = getDictionary("fr-FR");
const te = t.export;

registerPdfFonts();

// Numéros de page fixes du sommaire (retour utilisateur) : chaque section
// de tête (Sommaire, Résumé, Qualifications, Historique) occupe sa propre
// <Page> dédiée (voir CarnetPdfDocument ci-dessous), donc son numéro de
// page de DÉPART est connu à l'avance et n'a pas besoin d'être calculé
// après mise en page — seul l'Historique (dernière section) peut déborder
// sur plusieurs pages, sans conséquence puisque rien ne le suit.
const PAGE_NUMBERS = {
  tableOfContents: 2,
  stats: 3,
  qualifications: 4,
  activities: 5,
} as const;

const styles = StyleSheet.create({
  // Couverture façon page de garde de carnet papier (retour utilisateur,
  // variante "Carnet papier") : double filet encre autour de la page, pas
  // d'aplat plein cadre (jugé trop lourd visuellement dans un essai
  // précédent) — la couleur ne vient que de la marque et de l'ornement.
  coverPage: {
    fontFamily: PDF_FONT_FAMILY,
    backgroundColor: PDF_COLORS.background,
    padding: 22,
  },
  coverOuterFrame: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: PDF_COLORS.foreground,
    padding: 4,
  },
  coverInnerFrame: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.foreground,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  coverBrand: {
    fontSize: 8.5,
    fontWeight: "bold",
    letterSpacing: 4,
    color: PDF_COLORS.primaryDark,
  },
  // Ornement : filet ambre traversé d'un losange (carré pivoté de 45°, fond
  // papier pour "couper" le filet).
  ornament: {
    width: 60,
    height: 9,
    marginVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ornamentLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 4,
    height: 1,
    backgroundColor: PDF_COLORS.accent,
  },
  ornamentDiamond: {
    width: 7,
    height: 7,
    backgroundColor: PDF_COLORS.background,
    borderWidth: 1,
    borderColor: PDF_COLORS.accent,
    transform: "rotate(45deg)",
  },
  coverTitle: {
    fontFamily: PDF_SERIF_FONT_FAMILY,
    fontWeight: "semibold",
    fontSize: 30,
    lineHeight: 1.1,
    textAlign: "center",
    color: PDF_COLORS.foreground,
  },
  coverOwnerLabel: {
    marginTop: 4,
    fontSize: 9,
    color: PDF_COLORS.mutedForeground,
  },
  coverOwnerName: {
    marginTop: 3,
    fontFamily: PDF_SERIF_FONT_FAMILY,
    fontWeight: "semibold",
    fontSize: 15,
    color: PDF_COLORS.foreground,
  },
  coverDate: {
    marginTop: 36,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: PDF_COLORS.mutedForeground,
  },
  coverScope: {
    marginTop: 3,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: PDF_COLORS.mutedForeground,
  },
  contentPage: {
    fontFamily: PDF_FONT_FAMILY,
    backgroundColor: PDF_COLORS.background,
    paddingTop: 34,
    paddingHorizontal: 32,
    paddingBottom: 50,
    fontSize: 10,
    color: PDF_COLORS.foreground,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: PDF_SERIF_FONT_FAMILY,
    fontWeight: "semibold",
    fontSize: 20,
    color: PDF_COLORS.foreground,
    paddingBottom: 6,
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: PDF_COLORS.foreground,
  },
  emptyText: {
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
  },
  // Ligne à points de conduite (sommaire et résumé) : libellé, filet
  // pointillé qui occupe l'espace restant, puis valeur à droite.
  leaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 6,
  },
  leaderLabel: {
    fontSize: 11,
    fontWeight: "normal",
    color: PDF_COLORS.foreground,
  },
  leaderDots: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomStyle: "dotted",
    borderBottomColor: PDF_COLORS.dotted,
  },
  leaderValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.foreground,
  },
  leaderSubLabel: {
    fontSize: 9,
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
  },
  leaderSubRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 4,
    paddingLeft: 14,
  },
  qualificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
  },
  qualificationNumber: {
    width: 26,
    fontFamily: PDF_SERIF_FONT_FAMILY,
    fontWeight: "semibold",
    fontSize: 13,
    color: PDF_COLORS.accent,
  },
  qualificationName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
  },
  qualificationDate: {
    fontSize: 9,
    color: PDF_COLORS.mutedForeground,
  },
  // Sous-section par type d'activité : titre en serif, tableau réglé dessous.
  subsectionTitle: {
    fontFamily: PDF_SERIF_FONT_FAMILY,
    fontWeight: "semibold",
    fontSize: 12,
    color: PDF_COLORS.foreground,
    marginTop: 16,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.foreground,
  },
  tableHeaderText: {
    fontSize: 6.5,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: PDF_COLORS.mutedForeground,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5.5,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
    fontSize: 8.5,
  },
  // Largeurs fixes des colonnes Date et Durée : le Site prend le reste.
  // La date d'un vol inclut l'heure ("08/06/2024 à 10:00") et celle d'un
  // stage couvre deux dates ("03/06/2024 → 07/06/2024"), d'où une colonne
  // large, avec une gouttière à droite pour ne pas coller au Site.
  dateColumn: {
    width: 112,
    paddingRight: 8,
    color: PDF_COLORS.foreground,
  },
  siteColumn: {
    flex: 1,
    fontWeight: "bold",
  },
  durationColumn: {
    width: 46,
    textAlign: "right",
  },
  // Texte complet d'un vol (export filtré par dates) : filet ambre à gauche,
  // sous le nom du site, comme une remarque manuscrite en marge.
  activityDetail: {
    marginTop: 3,
    paddingLeft: 7,
    borderLeftWidth: 1.5,
    borderLeftColor: PDF_COLORS.accent,
    fontWeight: "normal",
    fontSize: 8.3,
    color: PDF_COLORS.foreground,
  },
  activityDetailLabel: {
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    fontFamily: PDF_SERIF_FONT_FAMILY,
    fontWeight: "semibold",
    fontSize: 8,
    color: PDF_COLORS.mutedForeground,
    textAlign: "center",
  },
});

type CarnetPdfDocumentProps = {
  data: CarnetExportData;
  pilotFirstName: string;
  editionDate: Date;
  // Bornes brutes "yyyy-MM-dd" telles que reçues par la route (#228) : la
  // portée affichée en couverture (historique complet vs plage précise) est
  // un souci d'affichage, pas une donnée de get-carnet-export-data.service.ts
  // (qui n'expose que detailLevel, compact/full).
  dateRange?: { from?: string; to?: string };
};

// "yyyy-MM-dd" -> Date : même interprétation que le reste de l'app pour un
// jour sans heure (ActivitiesFilter, create-flight.service.ts).
function getScopeLabel(dateRange: CarnetPdfDocumentProps["dateRange"]): string {
  const fromLabel = dateRange?.from ? formatDate(new Date(dateRange.from), "fr-FR") : undefined;
  const toLabel = dateRange?.to ? formatDate(new Date(dateRange.to), "fr-FR") : undefined;

  if (fromLabel && toLabel) return te.scopeDateRange(fromLabel, toLabel);
  if (fromLabel) return te.scopeFrom(fromLabel);
  if (toLabel) return te.scopeTo(toLabel);
  return te.scopeFullHistory;
}

// Composants React-PDF (moteur de rendu dédié, pas le DOM) : séparés de
// get-carnet-export-data.service.ts (couche de données) — les changements de
// mise en page ici ne risquent jamais de toucher la logique de calcul, et
// inversement (ADR 013).
export function CarnetPdfDocument({
  data,
  pilotFirstName,
  editionDate,
  dateRange,
}: CarnetPdfDocumentProps) {
  const editionDateLabel = formatDate(editionDate, "fr-FR");
  const scopeLabel = getScopeLabel(dateRange);
  const flights = data.activities.filter((activity) => activity.flight);
  const trainingCamps = data.activities.filter((activity) => activity.trainingCamp);
  const groundHandlingSessions = data.activities.filter(
    (activity) => activity.groundHandlingSession,
  );

  return (
    <Document>
      <Page size="A5" style={styles.coverPage}>
        <View style={styles.coverOuterFrame}>
          <View style={styles.coverInnerFrame}>
            <Text style={styles.coverBrand}>THERMIK</Text>
            <Ornament />
            <Text style={styles.coverTitle}>{te.coverTitle}</Text>
            <Ornament />
            <Text style={styles.coverOwnerLabel}>{te.coverOwnerLabel}</Text>
            <Text style={styles.coverOwnerName}>{pilotFirstName}</Text>
            <Text style={styles.coverDate}>{te.editionDate(editionDateLabel)}</Text>
            <Text style={styles.coverScope}>{scopeLabel}</Text>
          </View>
        </View>
      </Page>

      <ContentPage editionDateLabel={editionDateLabel}>
        <TableOfContentsSection
          hasFlights={flights.length > 0}
          hasTrainingCamps={trainingCamps.length > 0}
          hasGroundHandling={groundHandlingSessions.length > 0}
        />
      </ContentPage>

      <ContentPage editionDateLabel={editionDateLabel}>
        <StatsSection stats={data.stats} />
      </ContentPage>

      <ContentPage editionDateLabel={editionDateLabel}>
        <QualificationsSection qualifications={data.qualifications} />
      </ContentPage>

      <ContentPage editionDateLabel={editionDateLabel}>
        <ActivitiesSection
          hasActivities={data.activities.length > 0}
          flights={flights}
          trainingCamps={trainingCamps}
          groundHandlingSessions={groundHandlingSessions}
          detailLevel={data.detailLevel}
        />
      </ContentPage>
    </Document>
  );
}

// Chaque section de tête vit dans sa propre <Page> (une par appel) plutôt
// que toutes dans un seul flux : c'est ce qui rend les numéros de
// PAGE_NUMBERS fiables sans calcul post-mise en page. Le pied de page
// (fixed) doit être répété explicitement sur chacune, "fixed" ne se
// propageant qu'aux pages de continuation d'une même <Page> wrap, pas aux
// <Page> suivantes.
function ContentPage({
  editionDateLabel,
  children,
}: {
  editionDateLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Page size="A5" style={styles.contentPage} wrap>
      {children}
      {/* Numéro de page réel (render) plutôt que PAGE_NUMBERS : l'Historique
          peut déborder sur plusieurs pages. Tirets de part et d'autre, comme
          le folio d'un carnet imprimé. */}
      <Text
        style={styles.footer}
        fixed
        render={({ pageNumber }) => `— ${te.editionDate(editionDateLabel)} · ${pageNumber} —`}
      />
    </Page>
  );
}

// Ornement de couverture : filet ambre traversé d'un losange.
function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
    </View>
  );
}

// Ligne "libellé ........ valeur" : points de conduite du sommaire et du
// résumé. `sub` pour une entrée de second niveau (sous-section de
// l'historique), plus petite et décalée.
function LeaderRow({ label, value, sub }: { label: string; value?: string; sub?: boolean }) {
  return (
    <View style={sub ? styles.leaderSubRow : styles.leaderRow}>
      <Text style={sub ? styles.leaderSubLabel : styles.leaderLabel}>{label}</Text>
      <View style={styles.leaderDots} />
      {value !== undefined && <Text style={styles.leaderValue}>{value}</Text>}
    </View>
  );
}

function TableOfContentsSection({
  hasFlights,
  hasTrainingCamps,
  hasGroundHandling,
}: {
  hasFlights: boolean;
  hasTrainingCamps: boolean;
  hasGroundHandling: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{te.tableOfContentsTitle}</Text>
      <LeaderRow label={te.statsTitle} value={String(PAGE_NUMBERS.stats)} />
      <LeaderRow label={te.qualificationsTitle} value={String(PAGE_NUMBERS.qualifications)} />
      <LeaderRow label={te.activitiesTitle} value={String(PAGE_NUMBERS.activities)} />
      {hasFlights && (
        <LeaderRow sub label={te.flightsSectionTitle} value={String(PAGE_NUMBERS.activities)} />
      )}
      {hasTrainingCamps && (
        <LeaderRow
          sub
          label={te.trainingCampsSectionTitle}
          value={String(PAGE_NUMBERS.activities)}
        />
      )}
      {hasGroundHandling && (
        <LeaderRow
          sub
          label={te.groundHandlingSectionTitle}
          value={String(PAGE_NUMBERS.activities)}
        />
      )}
    </View>
  );
}

function StatsSection({ stats }: { stats: CarnetExportData["stats"] }) {
  const rows: Array<[string, string]> = [
    [te.flightCountLabel, String(stats.flightCount)],
    [
      te.cumulativeFlightTimeLabel,
      formatDurationMinutes(Math.round(stats.cumulativeFlightHours * 60)),
    ],
    [te.milestonesCrossedLabel, String(stats.milestoneHistory.length)],
    [te.favoriteSiteLabel, stats.favoriteSite?.label ?? te.noValue],
    [
      te.longestFlightLabel,
      stats.longestFlightDuration !== undefined
        ? formatDurationMinutes(stats.longestFlightDuration)
        : te.noValue,
    ],
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{te.statsTitle}</Text>
      {rows.map(([label, value]) => (
        <LeaderRow key={label} label={label} value={value} />
      ))}
    </View>
  );
}

function QualificationsSection({
  qualifications,
}: {
  qualifications: CarnetExportData["qualifications"];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{te.qualificationsTitle}</Text>
      {qualifications.length === 0 ? (
        <Text style={styles.emptyText}>{te.noQualificationsYet}</Text>
      ) : (
        qualifications.map((qualification, index) => (
          <View key={qualification.id} style={styles.qualificationRow}>
            <Text style={styles.qualificationNumber}>{index + 1}</Text>
            <Text style={styles.qualificationName}>
              {t.referenceLabels.qualificationType[qualification.qualificationType.code] ??
                qualification.qualificationType.code}
            </Text>
            <Text style={styles.qualificationDate}>
              {formatDate(qualification.obtainedDate, "fr-FR")}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// Une sous-section par type d'activité (retour utilisateur : séparer
// visuellement vols/stages/gonflages) plutôt qu'une liste unique mêlée —
// chaque sous-liste reste triée chronologiquement (ordre déjà garanti par
// get-carnet-export-data.service.ts, un simple filter le préserve). Le
// libellé de type n'est plus répété par ligne : il est porté par le titre
// de la sous-section.
function ActivitiesSection({
  hasActivities,
  flights,
  trainingCamps,
  groundHandlingSessions,
  detailLevel,
}: {
  hasActivities: boolean;
  flights: CarnetExportData["activities"];
  trainingCamps: CarnetExportData["activities"];
  groundHandlingSessions: CarnetExportData["activities"];
  detailLevel: CarnetExportData["detailLevel"];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{te.activitiesTitle}</Text>
      {!hasActivities ? (
        <Text style={styles.emptyText}>{te.noActivitiesYet}</Text>
      ) : (
        <>
          {flights.length > 0 && (
            <ActivityTypeGroup
              title={te.flightsSectionTitle}
              activities={flights}
              detailLevel={detailLevel}
            />
          )}
          {trainingCamps.length > 0 && (
            <ActivityTypeGroup
              title={te.trainingCampsSectionTitle}
              activities={trainingCamps}
              detailLevel={detailLevel}
            />
          )}
          {groundHandlingSessions.length > 0 && (
            <ActivityTypeGroup
              title={te.groundHandlingSectionTitle}
              activities={groundHandlingSessions}
              detailLevel={detailLevel}
            />
          )}
        </>
      )}
    </View>
  );
}

function ActivityTypeGroup({
  title,
  activities,
  detailLevel,
}: {
  title: string;
  activities: CarnetExportData["activities"];
  detailLevel: CarnetExportData["detailLevel"];
}) {
  return (
    <View>
      <Text style={styles.subsectionTitle}>{title}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.dateColumn]}>{te.tableDateHeader}</Text>
        <Text style={[styles.tableHeaderText, styles.siteColumn]}>{te.tableSiteHeader}</Text>
        <Text style={[styles.tableHeaderText, styles.durationColumn]}>
          {te.tableDurationHeader}
        </Text>
      </View>
      {activities.map((activity) => {
        const summary = getActivitySummary(activity, "fr-FR", t);
        const durationMin =
          activity.flight?.durationMin ?? activity.groundHandlingSession?.durationMin;

        return (
          // wrap={false} : une ligne (et son texte complet) ne se coupe
          // jamais entre deux pages.
          <View key={activity.id} style={styles.tableRow} wrap={false}>
            <Text style={styles.dateColumn}>{summary.dateInfo}</Text>
            <View style={styles.siteColumn}>
              <Text>{summary.location || summary.title}</Text>
              {detailLevel === "full" && activity.flight && (
                <View style={styles.activityDetail}>
                  <Text>
                    <Text style={styles.activityDetailLabel}>
                      {t.activities.observationsTitle}.
                    </Text>{" "}
                    {activity.flight.observations}
                  </Text>
                  <Text>
                    <Text style={styles.activityDetailLabel}>
                      {t.activities.improvementPointsTitle}.
                    </Text>{" "}
                    {activity.flight.improvementPoints}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.durationColumn}>
              {durationMin !== undefined ? formatDurationMinutes(durationMin) : te.noValue}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
