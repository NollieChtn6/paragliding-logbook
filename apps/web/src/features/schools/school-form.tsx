"use client";

import { useActionState, useEffect, useState } from "react";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { AddressSuggestion } from "@/features/address-search";
import { AddressCombobox } from "./address-combobox";

type SchoolFormActionState = { success: true } | { success: false; error: string };

type SchoolFormDefaultValues = {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
};

type SchoolFormProps = {
  action: (
    prevState: SchoolFormActionState | null,
    formData: FormData,
  ) => Promise<SchoolFormActionState>;
  defaultValues?: SchoolFormDefaultValues;
  submitLabel: string;
};

// Même principe que SiteForm : formulaire admin simple, sans assistant
// multi-étapes.
export function SchoolForm({ action, defaultValues, submitLabel }: SchoolFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const t = useT();
  const ts = t.schools;

  // N'initialise le combobox que si l'école a déjà une adresse "complète"
  // au sens BAN (avec coordonnées) : les écoles du seed n'ont ni latitude
  // ni longitude, on ne va pas en inventer pour les faire apparaître comme
  // sélectionnées. legacyAddress permet quand même à l'admin de voir/
  // retrouver l'adresse existante et de la resélectionner via la recherche.
  const initialAddress: AddressSuggestion | undefined =
    defaultValues?.address &&
    defaultValues?.postalCode &&
    defaultValues?.city &&
    defaultValues?.latitude !== undefined &&
    defaultValues?.longitude !== undefined
      ? {
          id: defaultValues.address,
          label: defaultValues.address,
          postalCode: defaultValues.postalCode,
          city: defaultValues.city,
          latitude: defaultValues.latitude,
          longitude: defaultValues.longitude,
        }
      : undefined;
  const legacyAddress = initialAddress ? undefined : defaultValues?.address;

  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(
    initialAddress ?? null,
  );

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, description: t.common.retryReassurance, type: "error" });
    }
  }, [state, t]);

  const legacyAddressExtra =
    defaultValues?.postalCode || defaultValues?.city
      ? ` (${[defaultValues.postalCode, defaultValues.city].filter(Boolean).join(" ")})`
      : "";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{ts.nameLabel}</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>

      <AddressCombobox name="address" defaultValue={initialAddress} onSelect={setSelectedAddress} />
      {legacyAddress && (
        <p className="text-sm text-muted-foreground">
          {ts.currentAddress(legacyAddress, legacyAddressExtra)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="postalCode">{ts.postalCodeLabel}</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={selectedAddress?.postalCode ?? ""}
            readOnly
            className="read-only:pointer-events-none read-only:cursor-not-allowed read-only:bg-input/50 read-only:opacity-50 dark:read-only:bg-input/80"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">{ts.cityLabel}</Label>
          <Input
            id="city"
            name="city"
            value={selectedAddress?.city ?? ""}
            readOnly
            className="read-only:pointer-events-none read-only:cursor-not-allowed read-only:bg-input/50 read-only:opacity-50 dark:read-only:bg-input/80"
          />
        </div>
      </div>

      {/* countryCode/latitude/longitude découlent de l'adresse BAN
      sélectionnée (voir AddressCombobox) : plus de saisie manuelle, juste
      transmis au formulaire. */}
      <input type="hidden" name="countryCode" value={selectedAddress ? "FR" : ""} />
      <input type="hidden" name="latitude" value={selectedAddress?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={selectedAddress?.longitude ?? ""} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="website">{ts.websiteLabel}</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://exemple.fr"
          defaultValue={defaultValues?.website}
        />
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
