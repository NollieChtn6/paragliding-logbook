import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type * as React from "react";
import { getActivitySummary } from "@/features/activities";
import { formatDate } from "@/lib/format-date";
import { formatDurationMinutes } from "@/lib/format-duration";
import { PDF_COLORS } from "@/lib/pdf/colors";
import { PDF_FONT_FAMILY, registerPdfFonts } from "@/lib/pdf/fonts";
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
  coverPage: {
    fontFamily: PDF_FONT_FAMILY,
    backgroundColor: PDF_COLORS.background,
    padding: 32,
    justifyContent: "center",
  },
  // Trait de couleur en kicker plutôt qu'un aplat plein cadre sur toute la
  // couverture (retour utilisateur — trop lourd visuellement) : même
  // logique que le badge de marque de apple-splash/route.tsx, une touche de
  // couleur plutôt qu'un fond entièrement teinté.
  coverAccentBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: PDF_COLORS.accent,
    marginBottom: 16,
  },
  coverKicker: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.primary,
    marginBottom: 4,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: PDF_COLORS.foreground,
  },
  coverDate: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
  },
  coverScope: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
  },
  contentPage: {
    fontFamily: PDF_FONT_FAMILY,
    backgroundColor: PDF_COLORS.background,
    padding: 28,
    paddingBottom: 40,
    fontSize: 10,
    color: PDF_COLORS.foreground,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: PDF_COLORS.primary,
    marginBottom: 6,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  statLabel: {
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
  },
  statValue: {
    fontWeight: "medium",
    color: PDF_COLORS.foreground,
  },
  emptyText: {
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
  },
  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  tocItem: {
    fontWeight: "medium",
    color: PDF_COLORS.foreground,
  },
  tocPageNumber: {
    fontWeight: "medium",
    color: PDF_COLORS.mutedForeground,
  },
  tocSubItem: {
    fontWeight: "normal",
    color: PDF_COLORS.mutedForeground,
    marginTop: 1,
    marginLeft: 12,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.accent,
    marginTop: 10,
    marginBottom: 4,
  },
  qualificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  activityRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  activityHeadline: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityTitle: {
    fontWeight: "medium",
    color: PDF_COLORS.foreground,
  },
  activityMeta: {
    marginTop: 1,
    color: PDF_COLORS.mutedForeground,
  },
  activityDetail: {
    marginTop: 2,
    color: PDF_COLORS.foreground,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
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
        <View style={styles.coverAccentBar} />
        <Text style={styles.coverKicker}>THERMIK</Text>
        <Text style={styles.coverTitle}>{te.coverTitle(pilotFirstName)}</Text>
        <Text style={styles.coverDate}>{te.editionDate(editionDateLabel)}</Text>
        <Text style={styles.coverScope}>{scopeLabel}</Text>
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
      <Text style={styles.footer} fixed>
        {te.editionDate(editionDateLabel)}
      </Text>
    </Page>
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
      <View style={styles.tocRow}>
        <Text style={styles.tocItem}>{te.statsTitle}</Text>
        <Text style={styles.tocPageNumber}>{PAGE_NUMBERS.stats}</Text>
      </View>
      <View style={styles.tocRow}>
        <Text style={styles.tocItem}>{te.qualificationsTitle}</Text>
        <Text style={styles.tocPageNumber}>{PAGE_NUMBERS.qualifications}</Text>
      </View>
      <View style={styles.tocRow}>
        <Text style={styles.tocItem}>{te.activitiesTitle}</Text>
        <Text style={styles.tocPageNumber}>{PAGE_NUMBERS.activities}</Text>
      </View>
      {hasFlights && <Text style={styles.tocSubItem}>{te.flightsSectionTitle}</Text>}
      {hasTrainingCamps && <Text style={styles.tocSubItem}>{te.trainingCampsSectionTitle}</Text>}
      {hasGroundHandling && <Text style={styles.tocSubItem}>{te.groundHandlingSectionTitle}</Text>}
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
        <View key={label} style={styles.statRow}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
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
        qualifications.map((qualification) => (
          <View key={qualification.id} style={styles.qualificationRow}>
            <Text>
              {t.referenceLabels.qualificationType[qualification.qualificationType.code] ??
                qualification.qualificationType.code}
            </Text>
            <Text>{formatDate(qualification.obtainedDate, "fr-FR")}</Text>
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
      {activities.map((activity) => {
        const summary = getActivitySummary(activity, "fr-FR", t);
        const durationMin =
          activity.flight?.durationMin ?? activity.groundHandlingSession?.durationMin;

        return (
          <View key={activity.id} style={styles.activityRow}>
            <View style={styles.activityHeadline}>
              <Text style={styles.activityTitle}>{summary.location || summary.title}</Text>
              {durationMin !== undefined && (
                <Text style={styles.activityTitle}>{formatDurationMinutes(durationMin)}</Text>
              )}
            </View>
            <Text style={styles.activityMeta}>{summary.dateInfo}</Text>
            {detailLevel === "full" && activity.flight && (
              <>
                <Text style={styles.activityDetail}>
                  {t.activities.observationsTitle} : {activity.flight.observations}
                </Text>
                <Text style={styles.activityDetail}>
                  {t.activities.improvementPointsTitle} : {activity.flight.improvementPoints}
                </Text>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}
