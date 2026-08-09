import { z } from "zod";

export const sitePointSearchSchema = z.object({
  query: z.string(),
  type: z.enum(["TAKEOFF", "LANDING"], "Le type de point recherché est invalide."),
});

export type SitePointSearchInput = z.infer<typeof sitePointSearchSchema>;
