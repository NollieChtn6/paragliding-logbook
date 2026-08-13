import type { Messages } from "@/messages";

// Utilisé par le mode assistant des formulaires (flight-form.tsx,
// training-camp-form.tsx, ground-handling-session-form.tsx) pour afficher
// une erreur en ligne sous chaque champ concerné, plutôt qu'un toast
// générique — le toast reste réservé aux erreurs de soumission et au
// succès. Vérifie `value` directement plutôt que de s'appuyer uniquement
// sur `validity.valid`/`reportValidity()` : le champ réellement lié à
// `name` pour SiteCombobox (voir site-combobox.tsx) n'est pas
// forcément celui qui porte l'attribut `required` en interne.
export function getFieldErrors(
  form: HTMLFormElement,
  fieldNames: string[],
  t: Pick<Messages["common"], "requiredField" | "invalidField">,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const fieldName of fieldNames) {
    const element = form.elements.namedItem(fieldName);
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      if (!element.value) {
        errors[fieldName] = t.requiredField;
      } else if (!element.validity.valid) {
        errors[fieldName] = t.invalidField;
      }
    }
  }
  return errors;
}
