"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITE_POINT_TYPE_LABELS } from "@/lib/reference-labels";

type SitePointsFiltersProps = {
  sites: { id: string; name: string }[];
  query?: string;
  siteId?: string;
  typeCode?: string;
};

const TYPE_OPTIONS = ["TAKEOFF", "LANDING"] as const;

// Filtrage serveur (docs/admin.md > Gestion des points de site : recherche +
// filtre par site + filtre par type, combinables) : contrairement au filtre
// de /activities (client, sur des données déjà chargées), ici les filtres
// changent l'URL (searchParams) pour redemander la liste au serveur — le
// nombre de points est amené à grandir (voir search-site-points.service.ts).
export function SitePointsFilters({ sites, query, siteId, typeCode }: SitePointsFiltersProps) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (siteId) params.set("siteId", siteId);
    if (typeCode) params.set("typeCode", typeCode);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/site-points${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form className="flex flex-1 gap-2">
        {siteId && <input type="hidden" name="siteId" value={siteId} />}
        {typeCode && <input type="hidden" name="typeCode" value={typeCode} />}
        <Input name="q" defaultValue={query} placeholder="Rechercher un point..." />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      <Select value={siteId ?? ""} onValueChange={(value) => updateParam("siteId", value ?? "")}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tous les sites">
            {(value: string | null) =>
              sites.find((site) => site.id === value)?.name ?? "Tous les sites"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les sites</SelectItem>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={typeCode ?? ""}
        onValueChange={(value) => updateParam("typeCode", value ?? "")}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Tous les types">
            {(value: string | null) =>
              value ? (SITE_POINT_TYPE_LABELS[value] ?? value) : "Tous les types"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les types</SelectItem>
          {TYPE_OPTIONS.map((code) => (
            <SelectItem key={code} value={code}>
              {SITE_POINT_TYPE_LABELS[code] ?? code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
