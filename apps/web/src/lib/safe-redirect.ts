// Empêche les open redirects : redirectTo vient du client (paramètre d'URL,
// champ de formulaire) et ne doit jamais pointer vers une origine externe.
export function toSafeRedirectPath(path: string | null | undefined, fallback: string): string {
  if (path?.startsWith("/") && !path.startsWith("//") && !path.includes("://")) {
    return path;
  }
  return fallback;
}
