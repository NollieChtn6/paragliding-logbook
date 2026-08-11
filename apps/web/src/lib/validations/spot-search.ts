import { z } from "zod";

export const spotSearchSchema = z.object({
  query: z.string(),
});

export type SpotSearchInput = z.infer<typeof spotSearchSchema>;
