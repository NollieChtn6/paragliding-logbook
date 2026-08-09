"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SelectClearButtonProps = {
  onClear: () => void;
  label: string;
};

// Les <Select> shadcn/Base UI n'ont pas d'action d'effacement native une
// fois une valeur choisie (il faut rouvrir le menu et en choisir une autre) :
// petit bouton croix affiché à côté du champ, uniquement quand il a une
// valeur — voir flight-form.tsx/training-camp-form.tsx/
// ground-handling-session-form.tsx pour l'usage (Select rendu contrôlé pour
// permettre ce reset imperatif).
export function SelectClearButton({ onClear, label }: SelectClearButtonProps) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onClear} aria-label={label}>
      <X className="size-4" />
    </Button>
  );
}
