import { LinesTuple } from "@/types"
import { RUNE_LINE_INDICES } from "@/utils/consts"
import z from "zod"

export const runeLinesSchema = z.tuple(
  RUNE_LINE_INDICES.map(() => z.boolean()) as LinesTuple<z.ZodBoolean>
)
