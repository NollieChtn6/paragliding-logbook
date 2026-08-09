"use client";

import { useActionState, useEffect, useState } from "react";
import { SelectClearButton } from "@/components/select-clear-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { SITE_POINT_TYPE_LABELS } from "@/lib/reference-labels";

type SitePointFormActionState = { success: true } | { success: false; error: string };

type SitePointFormDefaultValues = {
  label?: string;
  siteId?: string;
  sitePointTypeId?: string;
  latitude?: number;
  longitude?: number;
  altitudeM?: number;
  orientationDeg?: number;
};

type SitePointFormProps = {
  sites: { id: string; name: string }[];
  sitePointTypes: { id: string; code: string }[];
  action: (
    prevState: SitePointFormActionState | null,
    formData: FormData,
  ) => Promise<SitePointFormActionState>;
  defaultValues?: SitePointFormDefaultValues;
  submitLabel?: string;
};

function formatSitePointType(sitePointType: { code: string }): string {
  return SITE_POINT_TYPE_LABELS[sitePointType.code] ?? sitePointType.code;
}

// Le site et le type de point proviennent tous les deux d'un référentiel
// (docs/admin.md > Gestion des points de site, "Le type doit provenir du
// référentiel SitePointType, pas d'un champ texte libre") : Select contrôlé
// pour les deux, même principe que TrainingCampForm (bouton croix de
// réinitialisation).
export function SitePointForm({
  sites,
  sitePointTypes,
  action,
  defaultValues,
  submitLabel = "Créer le point",
}: SitePointFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [siteId, setSiteId] = useState(defaultValues?.siteId ?? "");
  const [sitePointTypeId, setSitePointTypeId] = useState(defaultValues?.sitePointTypeId ?? "");

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Nom</Label>
        <Input id="label" name="label" defaultValue={defaultValues?.label} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="siteId">Site</Label>
        <div className="flex items-center gap-1.5">
          <Select
            name="siteId"
            value={siteId}
            onValueChange={(value) => setSiteId(value ?? "")}
            required
          >
            <SelectTrigger id="siteId" className="w-full flex-1">
              <SelectValue placeholder="Choisir un site">
                {(value: string | null) =>
                  sites.find((site) => site.id === value)?.name ?? "Choisir un site"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {siteId && <SelectClearButton onClear={() => setSiteId("")} label="Effacer le site" />}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sitePointTypeId">Type</Label>
        <div className="flex items-center gap-1.5">
          <Select
            name="sitePointTypeId"
            value={sitePointTypeId}
            onValueChange={(value) => setSitePointTypeId(value ?? "")}
            required
          >
            <SelectTrigger id="sitePointTypeId" className="w-full flex-1">
              <SelectValue placeholder="Choisir un type">
                {(value: string | null) => {
                  const sitePointType = sitePointTypes.find((spt) => spt.id === value);
                  return sitePointType ? formatSitePointType(sitePointType) : "Choisir un type";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sitePointTypes.map((sitePointType) => (
                <SelectItem key={sitePointType.id} value={sitePointType.id}>
                  {formatSitePointType(sitePointType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sitePointTypeId && (
            <SelectClearButton onClear={() => setSitePointTypeId("")} label="Effacer le type" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={defaultValues?.latitude}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={defaultValues?.longitude}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="altitudeM">Altitude (m)</Label>
          <Input
            id="altitudeM"
            name="altitudeM"
            type="number"
            defaultValue={defaultValues?.altitudeM}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="orientationDeg">Orientation (°)</Label>
          <Input
            id="orientationDeg"
            name="orientationDeg"
            type="number"
            min={0}
            max={360}
            defaultValue={defaultValues?.orientationDeg}
          />
        </div>
      </div>

      <Button type="submit" className="mt-2" disabled={isPending}>
        {isPending ? "Enregistrement..." : submitLabel}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
