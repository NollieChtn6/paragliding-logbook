"use client";

import type * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/components/locale-provider";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  type EquipmentSelectOption,
  formatEquipmentOption,
} from "@/features/equipment/select-equipment-options";
import { getFieldErrors } from "@/lib/form-validation";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { SiteCombobox, type SiteOption } from "./site-combobox";

type TrainingCampOption = {
  id: string;
  trainingCampType: { code: string };
  startDate: Date;
  endDate: Date;
  school: { name: string };
};

type FlightTypeOption = { id: string; code: string };

type FlightFormActionState = { success: true } | { success: false; error: string };

type FlightFormDefaultValues = {
  // Porte aussi l'heure (voir toTimeInputValue ci-dessous) : pas de champ
  // "time" séparé ici, un seul Date sert à préremplir les deux <Input>.
  date?: Date;
  trainingCampId?: string;
  durationMin?: number;
  flightTypeId?: string;
  wingId?: string;
  harnessId?: string;
  reserveId?: string;
  observations?: string;
  improvementPoints?: string;
};

type FlightFormProps = {
  flightTypes: FlightTypeOption[];
  trainingCamps?: TrainingCampOption[];
  // Matériel ACTIVE de l'utilisateur du bon EquipmentType (voir
  // app/(app)/flights/new/page.tsx), plus l'élément déjà sélectionné en
  // édition même si son statut a changé depuis (docs/domain-model.md >
  // Règles métier > Matériel) — cette liste arrive déjà filtrée, le
  // formulaire ne fait aucun filtrage lui-même.
  wings?: EquipmentSelectOption[];
  harnesses?: EquipmentSelectOption[];
  reserves?: EquipmentSelectOption[];
  action: (
    prevState: FlightFormActionState | null,
    formData: FormData,
  ) => Promise<FlightFormActionState>;
  defaultValues?: FlightFormDefaultValues;
  defaultTakeoffPoint?: SiteOption;
  defaultLandingPoint?: SiteOption;
  submitLabel?: string;
  // Mode assistant en 3 étapes (utilisé par /activities/new,
  // new-activity-form.tsx) : absent = comportement historique inchangé, un
  // seul écran (/flights/new, /activities/[id]/edit). Voir le commentaire
  // au-dessus du <form> ci-dessous pour le détail du fonctionnement.
  wizardStep?: 2 | 3;
  onWizardBack?: () => void;
  onWizardNext?: () => void;
};

const WIZARD_STEP_2_REQUIRED_FIELDS = [
  "date",
  "time",
  "takeoffPointId",
  "landingPointId",
  "durationMin",
  "flightTypeId",
];
const WIZARD_STEP_3_REQUIRED_FIELDS = ["observations", "improvementPoints"];
// Hors mode assistant (/flights/new, /activities/[id]/edit) : tous les
// champs sont affichés sur un seul écran, donc validés d'un coup à la
// soumission plutôt qu'en deux temps.
const ALL_REQUIRED_FIELDS = [...WIZARD_STEP_2_REQUIRED_FIELDS, ...WIZARD_STEP_3_REQUIRED_FIELDS];

// Format attendu par <Input type="date">/<Input type="time">. Cohérent avec
// la lecture : le schéma Zod (flightSchema) combine ces deux chaînes en un
// Date UTC littéral (pas de conversion de fuseau horaire), donc les relire
// via toISOString().slice(...) restitue exactement les mêmes chaînes,
// indépendamment du fuseau du navigateur.
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  return date.toISOString().slice(11, 16);
}

// Distinct de toDateInputValue ci-dessus : "aujourd'hui" doit rester le jour
// calendaire local du pilote (getFullYear/Month/Date, pas toISOString) — un
// vol saisi juste après l'atterrissage en toute fin de soirée ne doit pas se
// voir proposer la date UTC du lendemain (critique dashboard, item P2 :
// "minimum de saisie" suppose que le champ le plus fréquent n'a rien à
// corriger).
function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Formulaire de vol partagé (shadcn/ui exclusivement, cf. CLAUDE.md), utilisé
// par /flights/new, /activities/new (création) et /activities/[id]/edit
// (modification) — action et defaultValues varient selon l'appelant.
// createFlightAction/updateFlightAction redirigent en cas de succès : il n'y
// a pas d'état "succès" à afficher ici.
export function FlightForm({
  flightTypes,
  trainingCamps = [],
  wings = [],
  harnesses = [],
  reserves = [],
  action,
  defaultValues,
  defaultTakeoffPoint,
  defaultLandingPoint,
  submitLabel,
  wizardStep,
  onWizardBack,
  onWizardNext,
}: FlightFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  // Select contrôlé (plutôt que defaultValue non contrôlé) : nécessaire pour
  // permettre au bouton croix (SelectClearButton) de réinitialiser la valeur
  // de l'extérieur du composant Select.
  const [trainingCampId, setTrainingCampId] = useState(defaultValues?.trainingCampId ?? "");
  const [flightTypeId, setFlightTypeId] = useState(defaultValues?.flightTypeId ?? "");
  const [wingId, setWingId] = useState(defaultValues?.wingId ?? "");
  const [harnessId, setHarnessId] = useState(defaultValues?.harnessId ?? "");
  const [reserveId, setReserveId] = useState(defaultValues?.reserveId ?? "");
  // Erreurs de validation affichées en ligne sous chaque champ (mode
  // assistant uniquement) — les toasts restent réservés à la soumission
  // (state?.success === false ci-dessous) et au succès (redirection +
  // toast, voir actions/create-flight.ts).
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [locale] = useLocale();
  const t = useT();
  const tf = t.flights;

  function formatTrainingCampOption(trainingCamp: TrainingCampOption): string {
    const typeLabel =
      t.referenceLabels.trainingCampType[trainingCamp.trainingCampType.code] ??
      trainingCamp.trainingCampType.code;
    return `${typeLabel} — ${trainingCamp.school.name} (${formatDate(trainingCamp.startDate, locale)} → ${formatDate(trainingCamp.endDate, locale)})`;
  }

  // Repli sur le code brut si un code existe en base sans entrée dans le
  // dictionnaire (docs/decisions/003-reference-table-codes.md) : ne doit pas
  // arriver en pratique (ces tables ne sont pas éditables en dehors du seed),
  // mais reste lisible plutôt que silencieusement vide.
  function formatFlightTypeOption(flightType: FlightTypeOption): string {
    return t.referenceLabels.flightType[flightType.code] ?? flightType.code;
  }

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, description: t.common.retryReassurance, type: "error" });
    }
  }, [state, t]);

  // Valeur imperative (pas defaultValue) : un <input> non contrôlé ne relit
  // sa prop defaultValue qu'au montage initial, qui doit rester identique
  // entre rendu serveur et hydratation (sans ça, avertissement d'hydratation
  // si l'heure du serveur diffère de celle du client). Écrit après montage,
  // uniquement en création (defaultValues absent) et seulement si l'usager
  // n'a encore rien saisi.
  useEffect(() => {
    if (defaultValues?.date) return;
    const dateInput = formRef.current?.elements.namedItem("date");
    if (dateInput instanceof HTMLInputElement && !dateInput.value) {
      dateInput.value = todayDateInputValue();
    }
  }, [defaultValues?.date]);

  function handleWizardNext() {
    const form = formRef.current;
    if (!form) return;

    const errors = getFieldErrors(form, WIZARD_STEP_2_REQUIRED_FIELDS, t.common);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Règle métier docs/domain-model.md (Stage) : un vol rattaché à un stage
    // doit avoir une date dans l'intervalle du stage — revérifiée côté
    // serveur (create-flight.service.ts/update-flight.service.ts), pas
    // exprimable par une contrainte HTML statique (dépend du stage choisi).
    // Vérifiée ici pour bloquer le passage à l'étape 3 au bon endroit (date
    // et stage associé sont des champs de l'étape 2).
    if (trainingCampId) {
      const selectedCamp = trainingCamps.find((tc) => tc.id === trainingCampId);
      const dateInput = form.elements.namedItem("date");
      const dateValue = dateInput instanceof HTMLInputElement ? dateInput.value : undefined;
      if (selectedCamp && dateValue) {
        const flightDate = new Date(dateValue);
        if (flightDate < selectedCamp.startDate || flightDate > selectedCamp.endDate) {
          setFieldErrors({
            date: tf.dateOutsideTrainingCampField,
          });
          return;
        }
      }
    }

    setFieldErrors({});
    onWizardNext?.();
  }

  // Applique le même traitement en ligne à la soumission finale : sans ça,
  // les champs retomberaient sur la bulle de validation native du
  // navigateur — non localisée (anglaise même sur une app entièrement
  // française) et sans état aria-invalid persistant pour un lecteur
  // d'écran. Étape 3 du mode assistant : seuls ses propres champs (l'étape
  // 2 a déjà été validée par handleWizardNext avant d'avancer). Hors mode
  // assistant (/flights/new, /activities/[id]/edit) : tous les champs,
  // puisqu'ils sont tous affichés sur ce même écran.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const requiredFields = wizardStep === 3 ? WIZARD_STEP_3_REQUIRED_FIELDS : ALL_REQUIRED_FIELDS;
    const errors = getFieldErrors(event.currentTarget, requiredFields, t.common);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
      setFieldErrors(errors);
    }
  }

  return (
    // noValidate : sans ça, la validation native du navigateur intercepte la
    // soumission avant même que l'événement "submit" (et donc handleSubmit
    // ci-dessus) ne s'exécute dès qu'un champ required est vide — bulle
    // anglaise non localisée et aucun aria-invalid persistant. handleSubmit
    // reproduit ces mêmes contraintes manuellement, de façon localisée.
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">{tf.detailsHeading}</h2>
      )}
      <div className={cn(wizardStep === 3 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="date">{tf.dateLabel}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultValues?.date ? toDateInputValue(defaultValues.date) : undefined}
              required
              aria-invalid={!!fieldErrors.date}
            />
            {fieldErrors.date && <p className="text-sm text-destructive">{fieldErrors.date}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="time">{tf.timeLabel}</Label>
            <Input
              id="time"
              name="time"
              type="time"
              defaultValue={defaultValues?.date ? toTimeInputValue(defaultValues.date) : undefined}
              required
              aria-invalid={!!fieldErrors.time}
            />
            {fieldErrors.time && <p className="text-sm text-destructive">{fieldErrors.time}</p>}
          </div>
        </div>

        <SiteCombobox
          type="TAKEOFF"
          name="takeoffPointId"
          label={tf.takeoffLabel}
          placeholder={tf.takeoffPlaceholder}
          defaultSite={defaultTakeoffPoint}
          error={fieldErrors.takeoffPointId}
        />

        <SiteCombobox
          type="LANDING"
          name="landingPointId"
          label={tf.landingLabel}
          placeholder={tf.landingPlaceholder}
          defaultSite={defaultLandingPoint}
          error={fieldErrors.landingPointId}
        />

        {trainingCamps.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="trainingCampId">{tf.trainingCampLabel}</Label>
            <div className="flex items-center gap-1.5">
              <Select
                name="trainingCampId"
                value={trainingCampId}
                onValueChange={(value) => setTrainingCampId(value ?? "")}
              >
                <SelectTrigger id="trainingCampId" className="w-full flex-1">
                  <SelectValue placeholder={tf.none}>
                    {(value: string) => {
                      const trainingCamp = trainingCamps.find((tc) => tc.id === value);
                      return trainingCamp ? formatTrainingCampOption(trainingCamp) : tf.none;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{tf.none}</SelectItem>
                  {trainingCamps.map((trainingCamp) => (
                    <SelectItem key={trainingCamp.id} value={trainingCamp.id}>
                      {/* whitespace-normal : contrecarre le whitespace-nowrap
                      hérité de SelectItem (ui/select.tsx) pour ce champ
                      seulement. Le libellé (école + dates) doit rester
                      lisible en entier pour distinguer deux stages du même
                      type/école — une coupure silencieuse (pas d'ellipsis,
                      popup en overflow-x-hidden) masquait justement les
                      dates, la seule information qui les différencie. */}
                      <span className="whitespace-normal">
                        {formatTrainingCampOption(trainingCamp)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {trainingCampId && (
                <SelectClearButton
                  onClear={() => setTrainingCampId("")}
                  label={tf.clearTrainingCamp}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMin">{tf.durationLabel}</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={1}
            defaultValue={defaultValues?.durationMin}
            required
            aria-invalid={!!fieldErrors.durationMin}
          />
          {fieldErrors.durationMin && (
            <p className="text-sm text-destructive">{fieldErrors.durationMin}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="flightTypeId">{tf.flightTypeLabel}</Label>
          <div className="flex items-center gap-1.5">
            <Select
              name="flightTypeId"
              value={flightTypeId}
              onValueChange={(value) => setFlightTypeId(value ?? "")}
              required
            >
              <SelectTrigger
                id="flightTypeId"
                className="w-full flex-1"
                aria-invalid={!!fieldErrors.flightTypeId}
              >
                <SelectValue placeholder={tf.chooseFlightType}>
                  {(value: string | null) => {
                    const flightType = flightTypes.find((ft) => ft.id === value);
                    return flightType ? formatFlightTypeOption(flightType) : tf.chooseFlightType;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {flightTypes.map((flightType) => (
                  <SelectItem key={flightType.id} value={flightType.id}>
                    {formatFlightTypeOption(flightType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {flightTypeId && (
              <SelectClearButton onClear={() => setFlightTypeId("")} label={tf.clearFlightType} />
            )}
          </div>
          {fieldErrors.flightTypeId && (
            <p className="text-sm text-destructive">{fieldErrors.flightTypeId}</p>
          )}
        </div>

        {wings.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="wingId">{tf.wingLabel}</Label>
            <div className="flex items-center gap-1.5">
              <Select
                name="wingId"
                value={wingId}
                onValueChange={(value) => setWingId(value ?? "")}
              >
                <SelectTrigger id="wingId" className="w-full flex-1">
                  <SelectValue placeholder={tf.none}>
                    {(value: string) => {
                      const wing = wings.find((w) => w.id === value);
                      return wing ? formatEquipmentOption(wing) : tf.none;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{tf.none}</SelectItem>
                  {wings.map((wing) => (
                    <SelectItem key={wing.id} value={wing.id}>
                      {formatEquipmentOption(wing)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {wingId && <SelectClearButton onClear={() => setWingId("")} label={tf.clearWing} />}
            </div>
          </div>
        )}

        {harnesses.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="harnessId">{tf.harnessLabel}</Label>
            <div className="flex items-center gap-1.5">
              <Select
                name="harnessId"
                value={harnessId}
                onValueChange={(value) => setHarnessId(value ?? "")}
              >
                <SelectTrigger id="harnessId" className="w-full flex-1">
                  <SelectValue placeholder={tf.none}>
                    {(value: string) => {
                      const harness = harnesses.find((h) => h.id === value);
                      return harness ? formatEquipmentOption(harness) : tf.none;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{tf.none}</SelectItem>
                  {harnesses.map((harness) => (
                    <SelectItem key={harness.id} value={harness.id}>
                      {formatEquipmentOption(harness)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {harnessId && (
                <SelectClearButton onClear={() => setHarnessId("")} label={tf.clearHarness} />
              )}
            </div>
          </div>
        )}

        {reserves.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="reserveId">{tf.reserveLabel}</Label>
            <div className="flex items-center gap-1.5">
              <Select
                name="reserveId"
                value={reserveId}
                onValueChange={(value) => setReserveId(value ?? "")}
              >
                <SelectTrigger id="reserveId" className="w-full flex-1">
                  <SelectValue placeholder={tf.none}>
                    {(value: string) => {
                      const reserve = reserves.find((r) => r.id === value);
                      return reserve ? formatEquipmentOption(reserve) : tf.none;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{tf.none}</SelectItem>
                  {reserves.map((reserve) => (
                    <SelectItem key={reserve.id} value={reserve.id}>
                      {formatEquipmentOption(reserve)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reserveId && (
                <SelectClearButton onClear={() => setReserveId("")} label={tf.clearReserve} />
              )}
            </div>
          </div>
        )}
      </div>

      {!wizardStep && (
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {tf.observationsHeading}
        </h2>
      )}
      <div className={cn(wizardStep === 2 ? "hidden" : "flex flex-col gap-4")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="observations">{tf.observationsLabel}</Label>
          <Textarea
            id="observations"
            name="observations"
            defaultValue={defaultValues?.observations}
            required={wizardStep !== 2}
            aria-invalid={!!fieldErrors.observations}
          />
          {fieldErrors.observations && (
            <p className="text-sm text-destructive">{fieldErrors.observations}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="improvementPoints">{tf.improvementPointsLabel}</Label>
          <Textarea
            id="improvementPoints"
            name="improvementPoints"
            defaultValue={defaultValues?.improvementPoints}
            required={wizardStep !== 2}
            aria-invalid={!!fieldErrors.improvementPoints}
          />
          {fieldErrors.improvementPoints && (
            <p className="text-sm text-destructive">{fieldErrors.improvementPoints}</p>
          )}
        </div>
      </div>

      {wizardStep ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={onWizardBack}>
            {tf.previous}
          </Button>
          {/* key distinct sur les deux boutons : sans ça, passer de l'étape 2
          à 3 fait muter le même nœud DOM de type="button" à type="submit"
          au lieu d'en monter un nouveau, et le clic en cours peut être
          traité par le navigateur comme un clic sur le bouton (désormais)
          submit — soumission accidentelle avant toute saisie à l'étape 3.
          Masqué ici par le required sur les champs de l'étape 3 (bloque la
          soumission via la validation native), mais bien réel — même bug
          plus visible sur TrainingCampForm, où aucun champ n'est requis. */}
          {wizardStep === 2 ? (
            <Button key="next" type="button" onClick={handleWizardNext}>
              {tf.next}
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={isPending}>
              {isPending ? t.common.saving : (submitLabel ?? tf.createFlight)}
            </Button>
          )}
        </div>
      ) : (
        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? t.common.saving : (submitLabel ?? tf.createFlight)}
        </Button>
      )}

      {state?.success === false && (
        <p role="alert" className="text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
