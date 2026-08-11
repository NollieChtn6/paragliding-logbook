"use client";

import { useEffect, useState } from "react";
import { searchAddressAction } from "@/actions/search-address";
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
import type { AddressSuggestion } from "@/features/address-search";

type AddressComboboxProps = {
  name: string;
  defaultValue?: AddressSuggestion;
  onSelect: (suggestion: AddressSuggestion | null) => void;
};

// Recherche BAN débouncée, même principe que SiteCombobox
// (features/ground-handling-sessions/site-combobox.tsx) : sélectionner une
// suggestion est le seul moyen de renseigner l'adresse — code postal,
// ville, latitude et longitude en découlent (voir school-form.tsx), pas de
// saisie libre indépendante pour ces champs. onSelect(null) sur effacement
// (bouton clear ou retour à un champ vide) : le parent réinitialise alors
// les champs dérivés.
export function AddressCombobox({ name, defaultValue, onSelect }: AddressComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>(defaultValue ? [defaultValue] : []);
  const [selected, setSelected] = useState<AddressSuggestion | null>(defaultValue ?? null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddressAction(query).then(setResults);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>Adresse</Label>
      <Combobox
        items={results}
        value={selected}
        onValueChange={(value) => {
          const suggestion = value as AddressSuggestion | null;
          setSelected(suggestion);
          onSelect(suggestion);
        }}
        onInputValueChange={setQuery}
        itemToStringLabel={(suggestion: AddressSuggestion) => suggestion.label}
        itemToStringValue={(suggestion: AddressSuggestion) => suggestion.label}
        isItemEqualToValue={(a: AddressSuggestion, b: AddressSuggestion) => a.id === b.id}
        filter={null}
        name={name}
      >
        <ComboboxInput id={name} placeholder="Rechercher une adresse..." showClear />
        <ComboboxContent>
          <ComboboxEmpty>Aucune adresse trouvée.</ComboboxEmpty>
          <ComboboxList>
            <ComboboxCollection>
              {(suggestion: AddressSuggestion) => (
                <ComboboxItem key={suggestion.id} value={suggestion}>
                  {suggestion.label}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
