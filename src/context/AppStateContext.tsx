import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react"
import { EditStates } from "@/utils/enums"

interface AppStateContextType {
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
