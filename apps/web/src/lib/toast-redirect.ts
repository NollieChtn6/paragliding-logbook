// Les Server Actions redirigent côté serveur (redirect()) après un succès :
// il n'y a pas de composant client "après succès" au moment de la
// redirection pour déclencher un toast (voir components/toast-listener.tsx).
// Le message est donc transporté dans l'URL de la page suivante.
export function withToast(path: string, message: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}toast=${encodeURIComponent(message)}`;
}
