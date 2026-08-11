import { z } from "zod";

export const siteSearchSchema = z.object({
  query: z.string(),
  type: z.enum(["TAKEOFF", "LANDING"], "Le type de site recherché est invalide."),
});

export type SiteSearchInput = z.infer<typeof siteSearchSchema>;
