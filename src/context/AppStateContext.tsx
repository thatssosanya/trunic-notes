// context/AppStateContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react"
import { EMPTY_RUNE_LINES } from "@/lib/consts"
import { RuneLines } from "@/types"
import { EditStates } from "@/lib/enums"

interface AppStateContextType {
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  searchRuneState: RuneLines
  setSearchRuneState: Dispatch<SetStateAction<RuneLines>>
  editingId: string | null
  editState: EditStates
  cancelEdit: () => void
  addRune: () => void
  editRune: (id: string) => void
  addChain: () => void
  editChain: (id: string) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchRuneState, setSearchRuneState] =
    useState<RuneLines>(EMPTY_RUNE_LINES)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditStates>(EditStates.IDLE)
  const cancelEdit = useCallback(() => {
    setEditState(EditStates.IDLE)
    setEditingId(null)
  }, [])
  const addRune = useCallback(() => {
    setEditState(EditStates.ADDING_RUNE)
    setEditingId(null)
  }, [])
  const editRune = useCallback((id: string) => {
    setEditState(EditStates.EDITING_RUNE)
    setEditingId(id)
  }, [])
  const addChain = useCallback(() => {
    setEditState(EditStates.ADDING_CHAIN)
    setEditingId(null)
  }, [])
  const editChain = useCallback((id: string) => {
    setEditState(EditStates.EDITING_CHAIN)
    setEditingId(id)
  }, [])

  const value = {
    searchQuery,
    setSearchQuery,
    searchRuneState,
    setSearchRuneState,
    editingId,
    editState,
    cancelEdit,
    addRune,
    editRune,
    addChain,
    editChain,
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}
