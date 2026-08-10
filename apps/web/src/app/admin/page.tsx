import { MapPin, School, Waypoints } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/prisma";

// Compteurs simples, pas de statistiques complexes (docs/admin.md >
// Dashboard administrateur) : trois count() suffisent, pas besoin d'un
// service dédié pour ça.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [siteCount, pointCount, schoolCount] = await Promise.all([
    prisma.site.count(),
    prisma.sitePoint.count(),
    prisma.school.count(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administration"
        description="Gestion des référentiels partagés de l'application."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={MapPin} label="Sites" value={siteCount} />
        <StatCard icon={Waypoints} label="Points de site" value={pointCount} />
        <StatCard icon={School} label="Écoles" value={schoolCount} tone="accent" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">Gestion</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/sites"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
          >
            <p className="font-medium text-foreground">Sites</p>
            <p className="text-sm text-muted-foreground">
              Lieux de pratique, décollages et atterrissages.
            </p>
          </Link>
          <Link
            href="/admin/site-points"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
          >
            <p className="font-medium text-foreground">Points de site</p>
            <p className="text-sm text-muted-foreground">Points de décollage et d'atterrissage.</p>
          </Link>
          <Link
            href="/admin/schools"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
          >
            <p className="font-medium text-foreground">Écoles</p>
            <p className="text-sm text-muted-foreground">Écoles fédérales de parapente.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
