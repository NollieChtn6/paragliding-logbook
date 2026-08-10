import { APP_COMMIT_SHA, APP_VERSION } from "@/lib/app-version";
import { cn } from "@/lib/utils";

type VersionBadgeProps = {
  className?: string;
};

// Version toujours visible (discrète), SHA du commit déployé uniquement en
// bonus dans le title (survol desktop) : distingue deux déploiements
// successifs du même tag (ex. plusieurs previews de develop avant le
// prochain tag) sans surcharger l'affichage.
export function VersionBadge({ className }: VersionBadgeProps) {
  return (
    <span
      className={cn("text-xs text-muted-foreground", className)}
      title={APP_COMMIT_SHA ? `Commit ${APP_COMMIT_SHA.slice(0, 7)}` : undefined}
    >
      v{APP_VERSION}
    </span>
  );
}
