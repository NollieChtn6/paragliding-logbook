"use client";

import { useEffect, useState } from "react";
import { searchCityAction } from "@/actions/search-city";
import { useT } from "@/components/locale-provider";
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
import type { CitySuggestion } from "@/features/address-search";

type CityComboboxProps = {
  name: string;
  defaultValue?: CitySuggestion;
};

// Recherche BAN débouncée, même principe qu'AddressCombobox
// (features/schools/address-combobox.tsx), mais plus simple : pas de champs
// dérivés séparés (code postal/coordonnées) à afficher/transmettre, city
// est le seul champ voulu ici — itemToStringValue renvoie directement le
// nom de la ville, c'est littéralement la valeur soumise du champ `name`.
// Facultatif (pas de `required` sur l'input) : city n'est pas obligatoire
// sur le profil.
export function CityCombobox({ name, defaultValue }: CityComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySuggestion[]>(defaultValue ? [defaultValue] : []);
  const [selected, setSelected] = useState<CitySuggestion | null>(defaultValue ?? null);
  const t = useT().account;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCityAction(query).then(setResults);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{t.cityLabel}</Label>
      <Combobox
        items={results}
        value={selected}
        onValueChange={(value) => setSelected(value as CitySuggestion | null)}
        onInputValueChange={setQuery}
        itemToStringLabel={(suggestion: CitySuggestion) =>
          suggestion.postalCode ? `${suggestion.city} (${suggestion.postalCode})` : suggestion.city
        }
        itemToStringValue={(suggestion: CitySuggestion) => suggestion.city}
        isItemEqualToValue={(a: CitySuggestion, b: CitySuggestion) => a.id === b.id}
        filter={null}
        name={name}
      >
        <ComboboxInput id={name} placeholder={t.cityPlaceholder} showClear />
        <ComboboxContent>
          <ComboboxEmpty>{t.cityEmpty}</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(suggestion: CitySuggestion) => (
                <ComboboxItem key={suggestion.id} value={suggestion}>
                  {suggestion.postalCode
                    ? `${suggestion.city} (${suggestion.postalCode})`
                    : suggestion.city}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
