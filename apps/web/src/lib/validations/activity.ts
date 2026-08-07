import { z } from "zod";

// Règles métier pas encore implémentées (docs/domain-rules.md > Activity) :
// une Activity possède exactement une spécialisation, et son type doit
// correspondre à cette spécialisation. Structure seule pour l'instant.
export const activitySchema = z.object({});

export type ActivityInput = z.infer<typeof activitySchema>;
