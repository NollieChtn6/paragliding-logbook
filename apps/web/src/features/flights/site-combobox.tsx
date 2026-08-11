"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { searchSitesAction } from "@/actions/search-sites";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

export type SiteOption = {
  id: string;
  label: string;
  altitudeM: number;
  orientationDeg: number | null;
  spot: { id: string; name: string };
};

type SiteGroup = { spot: { id: string; name: string }; sites: SiteOption[] };

function groupSitesBySpot(sites: SiteOption[]): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();
  for (const site of sites) {
    const group = groups.get(site.spot.id);
    if (group) {
      group.sites.push(site);
    } else {
      groups.set(site.spot.id, { spot: site.spot, sites: [site] });
    }
  }
  return [...groups.values()];
}

function formatOrientation(orientationDeg: number | null): string | null {
  if (orientationDeg === null) {
    return null;
  }
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(orientationDeg / 45) % 8;
  return directions[index];
}

function formatSiteItemLabel(site: SiteOption): string {
  const orientation = formatOrientation(site.orientationDeg);
  return `${site.label} · ${site.altitudeM} m${orientation ? ` · ${orientation}` : ""}`;
}

type SiteComboboxProps = {
  type: "TAKEOFF" | "LANDING";
  name: string;
  label: string;
  placeholder: string;
  defaultSite?: SiteOption;
  error?: string;
};

export function SiteCombobox({
  type,
  name,
  label,
  placeholder,
  defaultSite,
  error,
}: SiteComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteOption[]>(defaultSite ? [defaultSite] : []);
  const [selectedSite, setSelectedSite] = useState<SiteOption | null>(defaultSite ?? null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSitesAction(query, type).then(setResults);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query, type]);

  const siteGroups = groupSitesBySpot(results);
  const Icon = type === "TAKEOFF" ? ArrowUpRight : ArrowDownLeft;
  const iconClassName = type === "TAKEOFF" ? "text-primary" : "text-accent";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="flex items-center gap-1.5">
        <Icon className={`size-4 ${iconClassName}`} aria-hidden />
        {label}
      </Label>
      <Combobox
        items={results}
        value={selectedSite}
        onValueChange={(value) => setSelectedSite(value as SiteOption | null)}
        onInputValueChange={setQuery}
        itemToStringLabel={(site: SiteOption) => site.label}
        itemToStringValue={(site: SiteOption) => site.id}
        isItemEqualToValue={(a: SiteOption, b: SiteOption) => a.id === b.id}
        filter={null}
        name={name}
      >
        <ComboboxInput
          id={name}
          placeholder={placeholder}
          required
          showClear
          aria-invalid={!!error}
        />
        <ComboboxContent>
          <ComboboxEmpty>Aucun site trouvé.</ComboboxEmpty>
          <ComboboxList>
            {siteGroups.map((group) => (
              <ComboboxGroup key={group.spot.id} items={group.sites}>
                <ComboboxLabel>{group.spot.name}</ComboboxLabel>
                <ComboboxCollection>
                  {(site: SiteOption) => (
                    <ComboboxItem key={site.id} value={site}>
                      {formatSiteItemLabel(site)}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {selectedSite && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
          <p className="font-medium text-foreground">{selectedSite.label}</p>
          <p className="text-muted-foreground">{selectedSite.spot.name}</p>
          <p className="text-muted-foreground">
            {selectedSite.altitudeM} m
            {formatOrientation(selectedSite.orientationDeg) &&
              ` · ${formatOrientation(selectedSite.orientationDeg)}`}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
