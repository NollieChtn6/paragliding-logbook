import { z } from "zod";
import type { Messages } from "@/messages";

export function siteSearchSchema(t: Messages["validation"]["siteSearch"]) {
  return z.object({
    query: z.string(),
    type: z.enum(["TAKEOFF", "LANDING"], t.typeInvalid),
  });
}

export type SiteSearchInput = z.infer<ReturnType<typeof siteSearchSchema>>;
