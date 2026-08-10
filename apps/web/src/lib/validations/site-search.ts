import { z } from "zod";

export const siteSearchSchema = z.object({
  query: z.string(),
});

export type SiteSearchInput = z.infer<typeof siteSearchSchema>;
