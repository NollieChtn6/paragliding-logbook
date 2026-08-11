"use client";

import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { searchSpotsAction } from "@/actions/search-spots";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

export type SpotOption = {
  id: string;
  name: string;
  region: string | null;
};

type SpotComboboxProps = {
  name: string;
  defaultSpot?: SpotOption;
  error?: string;
};

// Recherche serveur débouncée, même principe que SiteCombobox
// (features/flights/site-combobox.tsx, audit UX item F4) : remplace
// le <Select> à liste complète, incohérent avec le combobox déjà utilisé
// pour les sites en formulaire de vol et amené à devenir peu
// maniable à mesure que le référentiel grandit. Ce composant ne reçoit
// jamais la liste complète des Spot, seulement éventuellement le spot déjà
// sélectionné (mode édition).
export function SpotCombobox({ name, defaultSpot, error }: SpotComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotOption[]>(defaultSpot ? [defaultSpot] : []);
  const [selectedSpot, setSelectedSpot] = useState<SpotOption | null>(defaultSpot ?? null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSpotsAction(query).then(setResults);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="flex items-center gap-1.5">
        <MapPin className="size-4 text-muted-foreground" aria-hidden />
        Spot
      </Label>
      <Combobox
        items={results}
        value={selectedSpot}
        onValueChange={(value) => setSelectedSpot(value as SpotOption | null)}
        onInputValueChange={setQuery}
        itemToStringLabel={(spot: SpotOption) => spot.name}
        itemToStringValue={(spot: SpotOption) => spot.id}
        isItemEqualToValue={(a: SpotOption, b: SpotOption) => a.id === b.id}
        filter={null}
        name={name}
      >
        <ComboboxInput
          id={name}
          placeholder="Rechercher un spot"
          required
          showClear
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxEmpty>Aucun spot trouvé.</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(spot: SpotOption) => (
                <ComboboxItem key={spot.id} value={spot}>
                  {spot.name}
                  {spot.region && <span className="text-muted-foreground"> · {spot.region}</span>}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
