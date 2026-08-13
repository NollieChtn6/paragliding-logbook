import { MapPin, School, Waypoints } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { getLocale } from "@/lib/i18n/get-locale";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";

// Compteurs simples, pas de statistiques complexes (docs/admin.md >
// Dashboard administrateur) : trois count() suffisent, pas besoin d'un
// service dédié pour ça.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [spotCount, siteCount, schoolCount] = await Promise.all([
    prisma.spot.count(),
    prisma.site.count(),
    prisma.school.count(),
  ]);
  const t = getDictionary(await getLocale());
  const ta = t.admin;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={ta.title} description={ta.dashboardDescription} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={MapPin} label={ta.navSpots} value={spotCount} />
        <StatCard icon={Waypoints} label={ta.navSites} value={siteCount} />
        <StatCard icon={School} label={ta.navSchools} value={schoolCount} tone="accent" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium tracking-tight text-foreground">{ta.manageHeading}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/spots"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
          >
            <p className="font-medium text-foreground">{ta.navSpots}</p>
            <p className="text-sm text-muted-foreground">{ta.spotsCardDescription}</p>
          </Link>
          <Link
            href="/admin/sites"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
          >
            <p className="font-medium text-foreground">{ta.navSites}</p>
            <p className="text-sm text-muted-foreground">{ta.sitesCardDescription}</p>
          </Link>
          <Link
            href="/admin/schools"
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
          >
            <p className="font-medium text-foreground">{ta.navSchools}</p>
            <p className="text-sm text-muted-foreground">{ta.schoolsCardDescription}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
