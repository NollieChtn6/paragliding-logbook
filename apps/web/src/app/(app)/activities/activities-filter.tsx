"use client";

import { ListFilter } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityCard, type ActivityCardType } from "@/components/activity-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { pluralize } from "@/lib/pluralize";

type ActivityListItem = {
  id: string;
  type: ActivityCardType;
  title: string;
  location: string;
  dateInfo: string;
  date: Date;
};

type ActivitiesFilterProps = {
  activities: ActivityListItem[];
};

const FILTER_TYPES: ActivityCardType[] = ["FLIGHT", "TRAINING_CAMP", "GROUND_HANDLING"];

// Évite un défilement qui s'allonge indéfiniment avec l'historique : une
// page de 20 tient largement sur un écran, mobile compris.
const PAGE_SIZE = 20;

// Comparaison au jour près via une chaîne "yyyy-MM-dd", même principe que
// create-flight.service.ts/update-flight.service.ts pour la règle "date
// dans l'intervalle du stage" : évite tout souci de fuseau horaire, et se
// compare directement à la valeur d'un <Input type="date">.
function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// N'appelée que si activities.length > 0 (page.tsx garde son propre
// EmptyState "aucune activité" pour le cas vraiment vide, distinct du cas
// "filtre sans résultat" géré ici) : filtrage entièrement client, la liste
// complète est déjà chargée par listActivities, pas besoin d'aller-retour
// serveur pour un simple filtre.
//
// Titre, sous-titre (nombre d'activités) et filtres vivent ici plutôt que
// dans page.tsx (Server Component) : le sous-titre doit refléter le compte
// filtré, et les trois doivent rester fixes pendant que seule la liste
// défile — md:h-full/overflow-hidden sur le conteneur racine, md:flex-1/
// min-h-0 sur la zone de liste, md:overflow-y-auto sur la liste elle-même
// (même principe que le dashboard, app/(app)/page.tsx).
export function ActivitiesFilter({ activities }: ActivitiesFilterProps) {
  // Ensemble vide = "Tout" (aucun filtre actif) : évite d'avoir à cocher les
  // 3 types en permanence pour représenter "tout afficher".
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityCardType>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const t = useT();
  const ta = t.activities;

  const filterLabels: Record<ActivityCardType, string> = {
    FLIGHT: ta.filterFlights,
    TRAINING_CAMP: ta.filterTrainingCamps,
    GROUND_HANDLING: ta.filterGroundHandling,
  };

  const hasActiveFilters = selectedTypes.size > 0 || dateFrom !== "" || dateTo !== "";

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        if (selectedTypes.size > 0 && !selectedTypes.has(activity.type)) {
          return false;
        }
        const day = toDayString(activity.date);
        if (dateFrom && day < dateFrom) {
          return false;
        }
        if (dateTo && day > dateTo) {
          return false;
        }
        return true;
      }),
    [activities, selectedTypes, dateFrom, dateTo],
  );

  const pageCount = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const paginatedActivities = filteredActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Revient à la première page à chaque changement de filtre (plutôt qu'un
  // useEffect séparé) : une page 3 qui n'existe plus une fois le filtre
  // appliqué serait déroutante.
  function toggleType(type: ActivityCardType, checked: boolean) {
    setSelectedTypes((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(type);
      } else {
        next.delete(type);
      }
      return next;
    });
    setPage(1);
  }

  function setAllTypes() {
    setSelectedTypes(new Set());
    setPage(1);
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    setPage(1);
  }

  function handleDateToChange(value: string) {
    setDateTo(value);
    setPage(1);
  }

  function resetFilters() {
    setSelectedTypes(new Set());
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const triggerLabel =
    selectedTypes.size === 0
      ? ta.allTypes
      : selectedTypes.size === 1
        ? filterLabels[[...selectedTypes][0]]
        : ta.typesSelected(selectedTypes.size);

  return (
    <div className="flex flex-col gap-6 md:h-full md:overflow-hidden">
      <PageHeader
        title={ta.pageTitle}
        description={pluralize(filteredActivities.length, ta.count)}
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/activities/new">{ta.newActivity}</Link>}
          />
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activities-date-from" className="text-xs text-muted-foreground">
              {ta.dateFromLabel}
            </Label>
            <Input
              id="activities-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => handleDateFromChange(event.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activities-date-to" className="text-xs text-muted-foreground">
              {ta.dateToLabel}
            </Label>
            <Input
              id="activities-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => handleDateToChange(event.target.value)}
              className="w-auto"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {ta.reset}
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline">
                <ListFilter className="size-4" aria-hidden />
                {triggerLabel}
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={selectedTypes.size === 0}
              onCheckedChange={setAllTypes}
            >
              {ta.all}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {FILTER_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.has(type)}
                onCheckedChange={(checked) => toggleType(type, checked)}
              >
                {filterLabels[type]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
        {filteredActivities.length === 0 ? (
          <EmptyState
            title={ta.noResultsTitle}
            description={ta.noResultsDescription}
            action={
              <Button variant="outline" onClick={resetFilters}>
                {ta.resetFilters}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2 md:overflow-y-auto">
            {paginatedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                href={`/activities/${activity.id}`}
                type={activity.type}
                title={activity.title}
                location={activity.location}
                dateInfo={activity.dateInfo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toujours affichée dès qu'il y a au moins un résultat, même sur une
      seule page (demande explicite) : Précédent/Suivant désactivés selon
      la position plutôt que le bloc masqué entièrement. */}
      {filteredActivities.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                {ta.previous}
              </Button>
            </PaginationItem>
            <PaginationItem>
              <p className="px-2 text-sm text-muted-foreground">{ta.pageOf(page, pageCount)}</p>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                {ta.next}
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
