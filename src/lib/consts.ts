export const GRID_COLS_CLASSES = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
  "6": "grid-cols-6",
  "8": "grid-cols-8",
  "10": "grid-cols-10",
  "12": "grid-cols-12",
  "16": "grid-cols-16",
  "20": "grid-cols-20",
} as const
export type GRID_COLS_OPTION = keyof typeof GRID_COLS_CLASSES
export const GRID_COLS_OPTIONS = Object.keys(
  GRID_COLS_CLASSES
) as GRID_COLS_OPTION[]

export const LINES_IN_RUNE = 12

export const VOWEL_LINE_INDICES = [0, 1, 6, 7, 10]
export const CONSONANT_LINE_INDICES = [2, 3, 4, 5, 8, 9]
