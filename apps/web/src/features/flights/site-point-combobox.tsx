"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { searchSitePointsAction } from "@/actions/search-site-points";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

export type SitePointOption = {
  id: string;
  label: string;
  altitudeM: number;
  orientationDeg: number | null;
  site: { id: string; name: string };
};

type SitePointGroup = { site: { id: string; name: string }; points: SitePointOption[] };

// Même principe que le regroupement par site déjà utilisé pour les anciens
// <Select> de départ/arrivée : la liste de résultats reste lisible même si
// deux points de sites différents portent un nom proche.
function groupPointsBySite(points: SitePointOption[]): SitePointGroup[] {
  const groups = new Map<string, SitePointGroup>();
  for (const point of points) {
    const group = groups.get(point.site.id);
    if (group) {
      group.points.push(point);
    } else {
      groups.set(point.site.id, { site: point.site, points: [point] });
    }
  }
  return [...groups.values()];
}

// Les degrés restent la donnée de référence en base (SitePoint.orientationDeg,
// docs/decisions/005-flight-takeoff-landing-points.md point 11) : conversion
// vers les 8 points cardinaux uniquement pour l'affichage. Rose des vents
// complète (pas seulement N/E/S/O) : le seed (prisma/seed.ts) utilise aussi
// les points intermédiaires (ex. SE, SO, NO), qui retombaient auparavant sur
// un affichage en degrés bruts ("135°"), incohérent avec les points cardinaux
// simples affichés en lettres.
function formatOrientation(orientationDeg: number | null): string | null {
  if (orientationDeg === null) return null;
  const cardinals = [
    { deg: 0, label: "N" },
    { deg: 45, label: "NE" },
    { deg: 90, label: "E" },
    { deg: 135, label: "SE" },
    { deg: 180, label: "S" },
    { deg: 225, label: "SO" },
    { deg: 270, label: "O" },
    { deg: 315, label: "NO" },
  ];
  const exact = cardinals.find((c) => c.deg === orientationDeg);
  return exact ? exact.label : `${orientationDeg}°`;
}

function formatPointItemLabel(point: SitePointOption): string {
  const orientation = formatOrientation(point.orientationDeg);
  return orientation
    ? `${point.label} (${point.altitudeM} m · ${orientation})`
    : `${point.label} (${point.altitudeM} m)`;
}

type SitePointComboboxProps = {
  type: "TAKEOFF" | "LANDING";
  name: string;
  label: string;
  placeholder: string;
  defaultPoint?: SitePointOption;
  // Erreur en ligne (mode assistant, voir flight-form.tsx) : le champ
  // effectivement lié à `name` (utilisé par getFieldErrors,
  // lib/form-validation.ts) est un <input> masqué géré par Combobox, pas
  // celui rendu ici — le parent doit donc transmettre le message lui-même.
  error?: string;
};

// Recherche serveur débouncée plutôt qu'une liste de points chargée
// d'avance (docs/decisions/005-flight-takeoff-landing-points.md) : ce
// composant ne reçoit jamais la liste complète des SitePoint, seulement
// éventuellement le point déjà sélectionné (mode édition).
export function SitePointCombobox({
  type,
  name,
  label,
  placeholder,
  defaultPoint,
  error,
}: SitePointComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SitePointOption[]>(defaultPoint ? [defaultPoint] : []);
  const [selectedPoint, setSelectedPoint] = useState<SitePointOption | null>(defaultPoint ?? null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSitePointsAction(query, type).then(setResults);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query, type]);

  const pointGroups = groupPointsBySite(results);

  const Icon = type === "TAKEOFF" ? ArrowUpRight : ArrowDownLeft;
  const iconClassName = type === "TAKEOFF" ? "text-primary" : "text-accent";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="flex items-center gap-1.5">
        <Icon className={`size-4 ${iconClassName}`} aria-hidden />
        {label}
      </Label>
      <Combobox
        items={results}
        value={selectedPoint}
        onValueChange={(value) => setSelectedPoint(value as SitePointOption | null)}
        onInputValueChange={setQuery}
        itemToStringLabel={(point: SitePointOption) => point.label}
        itemToStringValue={(point: SitePointOption) => point.id}
        isItemEqualToValue={(a: SitePointOption, b: SitePointOption) => a.id === b.id}
        filter={null}
        name={name}
      >
        <ComboboxInput
          id={name}
          placeholder={placeholder}
          required
          showClear
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxEmpty>Aucun point trouvé.</ComboboxEmpty>
          <ComboboxList>
            {pointGroups.map((group) => (
              <ComboboxGroup key={group.site.id} items={group.points}>
                <ComboboxLabel>{group.site.name}</ComboboxLabel>
                <ComboboxCollection>
                  {(point: SitePointOption) => (
                    <ComboboxItem key={point.id} value={point}>
                      {formatPointItemLabel(point)}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {selectedPoint && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
          <p className="font-medium text-foreground">{selectedPoint.label}</p>
          <p className="text-muted-foreground">{selectedPoint.site.name}</p>
          <p className="text-muted-foreground">
            {selectedPoint.altitudeM} m
            {formatOrientation(selectedPoint.orientationDeg) &&
              ` · ${formatOrientation(selectedPoint.orientationDeg)}`}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
