import { z } from "zod"
import { runeLinesSchema } from "@/lib/validation/common"

export const createChainSchema = z.object({
  runes: z.array(runeLinesSchema),
  translation: z.string().optional(),
  note: z.string().optional(),
})

export const updateChainSchema = createChainSchema.partial()
