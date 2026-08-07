import { z } from "zod";

// Règles métier pas encore implémentées (docs/domain-model.md > Stage) :
// startDate <= endDate, vols associés dans l'intervalle du stage. Structure
// seule pour l'instant.
export const trainingCampSchema = z.object({});

export type TrainingCampInput = z.infer<typeof trainingCampSchema>;
