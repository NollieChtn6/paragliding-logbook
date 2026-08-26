import { z } from "zod";
import type { Messages } from "@/messages";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : normalisée en undefined avant validation, même principe que
// lib/validations/training-camp.ts.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

// Règle métier docs/domain-model.md (Matériel) : initialUsageMin n'a de sens
// que si condition = USED, 0 sinon. Champ optionnel côté formulaire (une
// chaîne vide équivaut à 0), à la différence des durées obligatoires comme
// Flight.durationMin.
const initialUsageMinField = (t: Messages["validation"]["equipment"]) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? 0 : value),
    z.coerce
      .number(t.initialUsageInvalid)
      .int(t.initialUsageInteger)
      .min(0, t.initialUsageNegative),
  );

// equipmentTypeId : existence vérifiée dans le service (nécessite une
// lecture en base, comme qualificationTypeId dans qualificationSchema).
// brand/model : texte libre (pas de référentiel de marques), à la
// différence d'equipmentTypeId. size : optionnel, texte libre — le format
// varie selon la catégorie (surface en m² pour une voile, lettre S/M/L pour
// une sellette, plage de poids pour un secours), pas un champ typé unique
// (docs/domain-model.md). Pas de contrainte "purchaseDate pas dans le
// futur" : aucune règle de ce type dans docs/domain-model.md pour Equipment,
// à la différence de Flight.date/Qualification.obtainedDate.
function equipmentBaseSchema(t: Messages["validation"]["equipment"]) {
  return z.object({
    equipmentTypeId: z.string().uuid(t.typeInvalid),
    brand: z.string().trim().min(1, t.brandRequired).max(100, t.brandTooLong),
    model: z.string().trim().min(1, t.modelRequired).max(100, t.modelTooLong),
    size: optionalTrimmedString,
    purchaseDate: z.coerce.date(t.purchaseDateInvalid),
    condition: z.enum(["NEW", "USED"], t.conditionInvalid),
    initialUsageMin: initialUsageMinField(t),
  });
}

// initialUsageMin n'a de sens que si condition = USED (règle purement
// locale au formulaire, contrairement aux vérifications d'existence
// ci-dessus) : exprimable en Zod pur, pas besoin d'une lecture en base.
function withInitialUsageRule<
  Schema extends z.ZodType<{ condition: "NEW" | "USED"; initialUsageMin: number }>,
>(schema: Schema, t: Messages["validation"]["equipment"]) {
  return schema.refine((data) => data.condition === "USED" || data.initialUsageMin === 0, {
    message: t.initialUsageRequiresUsed,
    path: ["initialUsageMin"],
  });
}

// status non inclus ici : toujours ACTIVE par défaut à la création (défaut
// Prisma), modifiable uniquement via updateEquipmentSchema ci-dessous.
export function equipmentSchema(t: Messages["validation"]["equipment"]) {
  return withInitialUsageRule(equipmentBaseSchema(t), t);
}

// Même champs que equipmentSchema, plus status (ACTIVE/SOLD/RETIRED) :
// seul le formulaire de modification permet de retirer un équipement de la
// circulation (docs/domain-model.md > Règles métier > Matériel).
export function updateEquipmentSchema(t: Messages["validation"]["equipment"]) {
  return withInitialUsageRule(
    equipmentBaseSchema(t).extend({
      status: z.enum(["ACTIVE", "SOLD", "RETIRED"], t.statusInvalid),
    }),
    t,
  );
}

export type EquipmentInput = z.infer<ReturnType<typeof equipmentSchema>>;
export type UpdateEquipmentInput = z.infer<ReturnType<typeof updateEquipmentSchema>>;
