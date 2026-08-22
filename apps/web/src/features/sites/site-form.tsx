"use client";

import { useActionState, useEffect, useState } from "react";
import { useT } from "@/components/locale-provider";
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

type SiteFormActionState = { success: true } | { success: false; error: string };

type SiteFormDefaultValues = {
  label?: string;
  spotId?: string;
  siteTypeId?: string;
  latitude?: number;
  longitude?: number;
  altitudeM?: number;
  orientationDeg?: number;
};

type SiteFormProps = {
  spots: { id: string; name: string }[];
  siteTypes: { id: string; code: string }[];
  action: (
    prevState: SiteFormActionState | null,
    formData: FormData,
  ) => Promise<SiteFormActionState>;
  defaultValues?: SiteFormDefaultValues;
  submitLabel: string;
};

// Le spot et le type de site proviennent tous les deux d'un référentiel
// (docs/admin.md > Gestion des sites, "Le type doit provenir du référentiel
// SiteType, pas d'un champ texte libre") : Select contrôlé pour les deux,
// même principe que TrainingCampForm (bouton croix de réinitialisation).
export function SiteForm({ spots, siteTypes, action, defaultValues, submitLabel }: SiteFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [spotId, setSpotId] = useState(defaultValues?.spotId ?? "");
  const [siteTypeId, setSiteTypeId] = useState(defaultValues?.siteTypeId ?? "");
  const t = useT();
  const ts = t.sites;

  function formatSiteType(siteType: { code: string }): string {
    return t.referenceLabels.siteType[siteType.code] ?? siteType.code;
  }

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, description: t.common.retryReassurance, type: "error" });
    }
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="label">{ts.nameLabel}</Label>
        <Input id="label" name="label" defaultValue={defaultValues?.label} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="spotId">{ts.spotLabel}</Label>
        <div className="flex items-center gap-1.5">
          <Select
            name="spotId"
            value={spotId}
            onValueChange={(value) => setSpotId(value ?? "")}
            required
          >
            <SelectTrigger id="spotId" className="w-full flex-1">
              <SelectValue placeholder={ts.chooseSpot}>
                {(value: string | null) =>
                  spots.find((spot) => spot.id === value)?.name ?? ts.chooseSpot
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {spots.map((spot) => (
                <SelectItem key={spot.id} value={spot.id}>
                  {spot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {spotId && <SelectClearButton onClear={() => setSpotId("")} label={ts.clearSpot} />}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="siteTypeId">{ts.typeLabel}</Label>
        <div className="flex items-center gap-1.5">
          <Select
            name="siteTypeId"
            value={siteTypeId}
            onValueChange={(value) => setSiteTypeId(value ?? "")}
            required
          >
            <SelectTrigger id="siteTypeId" className="w-full flex-1">
              <SelectValue placeholder={ts.chooseType}>
                {(value: string | null) => {
                  const siteType = siteTypes.find((st) => st.id === value);
                  return siteType ? formatSiteType(siteType) : ts.chooseType;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {siteTypes.map((siteType) => (
                <SelectItem key={siteType.id} value={siteType.id}>
                  {formatSiteType(siteType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {siteTypeId && (
            <SelectClearButton onClear={() => setSiteTypeId("")} label={ts.clearType} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="latitude">{ts.latitudeLabel}</Label>
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
          <Label htmlFor="longitude">{ts.longitudeLabel}</Label>
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
          <Label htmlFor="altitudeM">{ts.altitudeLabel}</Label>
          <Input
            id="altitudeM"
            name="altitudeM"
            type="number"
            defaultValue={defaultValues?.altitudeM}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="orientationDeg">{ts.orientationLabel}</Label>
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
        {isPending ? t.common.saving : submitLabel}
      </Button>

      {state?.success === false && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
