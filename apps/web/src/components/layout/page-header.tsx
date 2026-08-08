import type * as React from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

// En-tête de page réutilisable : titre + description optionnelle + zone
// d'action (ex. "Nouvelle activité"). Barème typographique
// docs/ui-directions.md.
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
