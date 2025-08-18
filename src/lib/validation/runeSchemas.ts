import { z } from "zod"
import { runeLinesSchema } from "@/lib/validation/common"

export const createRuneSchema = z.object({
  lines: runeLinesSchema,
  translation: z.string().optional(),
  note: z.string().optional(),
  isConfident: z.boolean().optional(),
})

export const updateRuneSchema = createRuneSchema.partial()

export const reorderRunesSchema = z.object({
  orderedIds: z.array(z.string().nonempty()),
})
