import { z } from "zod";

// Règles métier pas encore implémentées (docs/domain-model.md > Gonflage) :
// durée strictement positive, exercices travaillés obligatoires. Structure
// seule pour l'instant.
export const groundHandlingSchema = z.object({});

export type GroundHandlingInput = z.infer<typeof groundHandlingSchema>;
