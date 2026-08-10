"use client";

import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { searchSitesAction } from "@/actions/search-sites";
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

export type SiteOption = {
  id: string;
  name: string;
  region: string | null;
};

type SiteComboboxProps = {
  name: string;
  defaultSite?: SiteOption;
  error?: string;
};

// Recherche serveur débouncée, même principe que SitePointCombobox
// (features/flights/site-point-combobox.tsx, audit UX item F4) : remplace
// le <Select> à liste complète, incohérent avec le combobox déjà utilisé
// pour les points de site en formulaire de vol et amené à devenir peu
// maniable à mesure que le référentiel grandit. Ce composant ne reçoit
// jamais la liste complète des Site, seulement éventuellement le site déjà
// sélectionné (mode édition).
export function SiteCombobox({ name, defaultSite, error }: SiteComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteOption[]>(defaultSite ? [defaultSite] : []);
  const [selectedSite, setSelectedSite] = useState<SiteOption | null>(defaultSite ?? null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSitesAction(query).then(setResults);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="flex items-center gap-1.5">
        <MapPin className="size-4 text-muted-foreground" aria-hidden />
        Site
      </Label>
      <Combobox
        items={results}
        value={selectedSite}
        onValueChange={(value) => setSelectedSite(value as SiteOption | null)}
        onInputValueChange={setQuery}
        itemToStringLabel={(site: SiteOption) => site.name}
        itemToStringValue={(site: SiteOption) => site.id}
        isItemEqualToValue={(a: SiteOption, b: SiteOption) => a.id === b.id}
        filter={null}
        name={name}
      >
        <ComboboxInput
          id={name}
          placeholder="Rechercher un site"
          required
          showClear
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxEmpty>Aucun site trouvé.</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(site: SiteOption) => (
                <ComboboxItem key={site.id} value={site}>
                  {site.name}
                  {site.region && <span className="text-muted-foreground"> · {site.region}</span>}
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
