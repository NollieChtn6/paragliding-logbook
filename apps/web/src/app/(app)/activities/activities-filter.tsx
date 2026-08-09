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

type ActivityListItem = {
  id: string;
  type: ActivityCardType;
  title: string;
  subtitle: string;
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

// N'appelée que si activities.length > 0 (page.tsx garde son EmptyState
// "aucune activité" pour le cas vraiment vide, distinct du cas "filtre sans
// résultat" géré ici) : filtrage entièrement client, la liste complète est
// déjà chargée par listActivities, pas besoin d'aller-retour serveur pour
// un simple filtre.
export function ActivitiesFilter({ activities }: ActivitiesFilterProps) {
  // Ensemble vide = "Tout" (aucun filtre actif) : évite d'avoir à cocher les
  // 3 types en permanence pour représenter "tout afficher".
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityCardType>>(new Set());

  const filteredActivities = useMemo(
    () =>
      selectedTypes.size === 0
        ? activities
        : activities.filter((activity) => selectedTypes.has(activity.type)),
    [activities, selectedTypes],
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

      {filteredActivities.length === 0 ? (
        <EmptyState
          title="Aucune activité ne correspond à ce filtre"
          description="Essayez un autre type, ou réinitialisez le filtre."
          action={
            <Button variant="outline" onClick={() => setSelectedTypes(new Set())}>
              Réinitialiser le filtre
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
              subtitle={activity.subtitle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
