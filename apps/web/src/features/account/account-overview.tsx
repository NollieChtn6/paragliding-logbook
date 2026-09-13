"use client";

import { useState } from "react";
import { ProfileAvatar, type ProfileSummary } from "@/components/layout/profile-avatar";
import { useT } from "@/components/locale-provider";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

// Bandeau d'identité (avatar + nom + email + ville) suivi d'onglets locaux
// Profil/Sécurité (une seule carte visible à la fois) : remplace les deux
// cartes historiques côte à côte. Même logique d'identité que AccountSheet
// (components/layout/account-sheet.tsx, pied de DesktopSidebar) — issu d'un
// prototype comparant 3 pistes (voir branche prototype/profile-access),
// cette variante retenue.
export function AccountOverview({ user }: { user: ProfileSummary }) {
  const [section, setSection] = useState<"profile" | "security">("profile");
  const t = useT().account;

  const tabs = [
    { key: "profile" as const, label: t.profileCardTitle },
    { key: "security" as const, label: t.securityCardTitle },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:text-left">
        <ProfileAvatar user={user} className="size-16 text-xl" />
        <div className="flex min-w-0 flex-col">
          <span className="text-lg font-medium text-foreground">{user.name}</span>
          <span className="truncate text-sm text-muted-foreground">{user.email}</span>
          {user.city && <span className="text-xs text-muted-foreground">{user.city}</span>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSection(tab.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              section === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          {section === "profile" ? (
            <ProfileForm name={user.name} city={user.city} />
          ) : (
            <ChangePasswordForm email={user.email} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
