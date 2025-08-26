import { RUNE_LINE_INDICES } from "@/utils/consts"

export const isExactLineMatch = (
  a: boolean[],
  b: boolean[],
  indices: number[] = RUNE_LINE_INDICES // check all lines by default
) => {
  if (indices.every((i) => a[i] === false || b[i] === false)) {
    return false
  }
  return indices.every((i) => a[i] === b[i])
}
