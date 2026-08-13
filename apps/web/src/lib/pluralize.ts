export type PluralForms = {
  one: string;
  other: string;
};

// Anglais/français n'ont que deux formes (singulier "1", pluriel "tout le
// reste, y compris 0") : pas besoin d'un moteur ICU complet (Intl.PluralRules)
// pour ces deux locales.
export function pluralize(count: number, forms: PluralForms): string {
  return (count === 1 ? forms.one : forms.other).replace("{n}", String(count));
}
