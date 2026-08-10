"use client";

import { ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import { ActivityCard, type ActivityCardType } from "@/components/activity-card";
import { EmptyState } from "@/components/empty-state";
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

const FILTER_LABELS: Record<ActivityCardType, string> = {
  FLIGHT: "Vols",
  TRAINING_CAMP: "Stages",
  GROUND_HANDLING: "Séances de gonflage",
};

// Comparaison au jour près via une chaîne "yyyy-MM-dd", même principe que
// create-flight.service.ts/update-flight.service.ts pour la règle "date
// dans l'intervalle du stage" : évite tout souci de fuseau horaire, et se
// compare directement à la valeur d'un <Input type="date">.
function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// N'appelée que si activities.length > 0 (page.tsx garde son EmptyState
// "aucune activité" pour le cas vraiment vide, distinct du cas "filtre sans
// résultat" géré ici) : filtrage entièrement client, la liste complète est
// déjà chargée par listActivities, pas besoin d'aller-retour serveur pour
// un simple filtre.
export function ActivitiesFilter({ activities }: ActivitiesFilterProps) {
  // Ensemble vide = "Tout" (aucun filtre actif) : évite d'avoir à cocher les
  // 3 types en permanence pour représenter "tout afficher".
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityCardType>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
  }

  function resetFilters() {
    setSelectedTypes(new Set());
    setDateFrom("");
    setDateTo("");
  }

  const triggerLabel =
    selectedTypes.size === 0
      ? "Tous les types"
      : selectedTypes.size === 1
        ? FILTER_LABELS[[...selectedTypes][0]]
        : `${selectedTypes.size} types sélectionnés`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filteredActivities.length} activité{filteredActivities.length > 1 ? "s" : ""}
        </p>
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
              onCheckedChange={() => setSelectedTypes(new Set())}
            >
              Tout
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {FILTER_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.has(type)}
                onCheckedChange={(checked) => toggleType(type, checked)}
              >
                {FILTER_LABELS[type]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activities-date-from" className="text-xs text-muted-foreground">
            Du
          </Label>
          <Input
            id="activities-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-auto"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activities-date-to" className="text-xs text-muted-foreground">
            Au
          </Label>
          <Input
            id="activities-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-auto"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Réinitialiser
          </Button>
        )}
      </div>

      {filteredActivities.length === 0 ? (
        <EmptyState
          title="Aucune activité ne correspond à ce filtre"
          description="Essayez d'autres critères, ou réinitialisez les filtres."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredActivities.map((activity) => (
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
  );
}
