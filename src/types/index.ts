export type RuneData = {
  lines: boolean[]
  translation: string
  isConfident: boolean
  note: string
}

export type Rune = RuneData & {
  id: string
  userId: string
  sequence: number
}

export type UserData = {
  name: string
  password: string
}

export type User = Omit<UserData, "password"> & {
  id: string
}
