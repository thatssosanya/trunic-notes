import { GRID_COLS_CLASSES, GRID_COLS_MOBILE_CLASSES } from "@/styles"
import { ChainData, LinesTuple, RuneData, RuneLines } from "@/types"

export type GRID_COLS_OPTION = keyof typeof GRID_COLS_CLASSES

// does not include default desktop option
export const GRID_COLS_MOBILE_OPTIONS = Object.keys(
  GRID_COLS_MOBILE_CLASSES
) as GRID_COLS_OPTION[]
export const GRID_COLS_OPTIONS = Object.keys(
  GRID_COLS_CLASSES
) as GRID_COLS_OPTION[]

export const GRID_COLS_DESKTOP_DEFAULT = "8"
export const GRID_COLS_MOBILE_DEFAULT = "2"

export const RUNE_LINE_COUNT = 12
export const RUNE_LINE_INDICES = Array(RUNE_LINE_COUNT)
  .fill(0)
  .map((_, i) => i) as LinesTuple<number>
export const EMPTY_RUNE_LINES = Array(RUNE_LINE_COUNT).fill(false) as RuneLines

export const VOWEL_LINE_INDICES = [0, 1, 6, 7, 10]
export const CONSONANT_LINE_INDICES = [2, 3, 4, 5, 8, 9]

export const EMPTY_RUNE_DATA: RuneData = {
  lines: EMPTY_RUNE_LINES,
  translation: "",
  note: "",
  isConfident: true,
}

export const EMPTY_CHAIN_DATA: ChainData = {
  runes: [EMPTY_RUNE_LINES],
  translation: "",
  note: "",
}
