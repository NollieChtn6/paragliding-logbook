// Utilisé par le mode assistant des formulaires (flight-form.tsx,
// training-camp-form.tsx, ground-handling-session-form.tsx) pour afficher
// une erreur en ligne sous chaque champ concerné, plutôt qu'un toast
// générique — le toast reste réservé aux erreurs de soumission et au
// succès. Vérifie `value` directement plutôt que de s'appuyer uniquement
// sur `validity.valid`/`reportValidity()` : le champ réellement lié à
// `name` pour SitePointCombobox (voir site-point-combobox.tsx) n'est pas
// forcément celui qui porte l'attribut `required` en interne.
const REQUIRED_FIELD_ERROR = "Ce champ est obligatoire.";
const INVALID_FIELD_ERROR = "Cette valeur n'est pas valide.";

export function getFieldErrors(
  form: HTMLFormElement,
  fieldNames: string[],
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
        errors[fieldName] = REQUIRED_FIELD_ERROR;
      } else if (!element.validity.valid) {
        errors[fieldName] = INVALID_FIELD_ERROR;
      }
    }
  }
  return errors;
}
