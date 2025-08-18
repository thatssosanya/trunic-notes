// 12 lines in a rune
export type LinesTuple<T> = [T, T, T, T, T, T, T, T, T, T, T, T]

export type RuneLines = LinesTuple<boolean>

export type RuneData = {
  lines: RuneLines
  translation: string
  isConfident: boolean
  note: string
}

export type Rune = RuneData & {
  id: string
  sequence: number
}

export type DbRune = Rune & {
  userId: string
}

export type ChainData = {
  runes: RuneLines[]
  translation: string
  note: string
}

export type Chain = ChainData & {
  id: string
  sequence: number
}

export type DbChain = Chain & {
  userId: string
}

export type UserData = {
  name: string
  password: string
}

export type User = Omit<UserData, "password"> & {
  id: string
}
