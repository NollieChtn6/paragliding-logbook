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
import { SITE_TYPE_LABELS } from "@/lib/reference-labels";

type SitesFiltersProps = {
  spots: { id: string; name: string }[];
  query?: string;
  spotId?: string;
  typeCode?: string;
};

const TYPE_OPTIONS = ["TAKEOFF", "LANDING"] as const;

// Filtrage serveur (docs/admin.md > Gestion des sites : recherche + filtre
// par spot + filtre par type, combinables) : contrairement au filtre de
// /activities (client, sur des données déjà chargées), ici les filtres
// changent l'URL (searchParams) pour redemander la liste au serveur — le
// nombre de sites est amené à grandir (voir search-sites.service.ts).
export function SitesFilters({ spots, query, spotId, typeCode }: SitesFiltersProps) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (spotId) params.set("spotId", spotId);
    if (typeCode) params.set("typeCode", typeCode);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/sites${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form className="flex flex-1 gap-2">
        {spotId && <input type="hidden" name="spotId" value={spotId} />}
        {typeCode && <input type="hidden" name="typeCode" value={typeCode} />}
        <Input name="q" defaultValue={query} placeholder="Rechercher un site..." />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      <Select value={spotId ?? ""} onValueChange={(value) => updateParam("spotId", value ?? "")}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tous les spots">
            {(value: string | null) =>
              spots.find((spot) => spot.id === value)?.name ?? "Tous les spots"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les spots</SelectItem>
          {spots.map((spot) => (
            <SelectItem key={spot.id} value={spot.id}>
              {spot.name}
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
              value ? (SITE_TYPE_LABELS[value] ?? value) : "Tous les types"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les types</SelectItem>
          {TYPE_OPTIONS.map((code) => (
            <SelectItem key={code} value={code}>
              {SITE_TYPE_LABELS[code] ?? code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
