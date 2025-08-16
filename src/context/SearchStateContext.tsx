import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react"
import { EMPTY_RUNE_LINES } from "@/lib/consts"
import { RuneLines } from "@/types"

interface SearchStateContextType {
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  searchRuneState: RuneLines
  setSearchRuneState: Dispatch<SetStateAction<RuneLines>>
}

const SearchStateContext = createContext<SearchStateContextType | undefined>(
  undefined
)

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchRuneState, setSearchRuneState] =
    useState<RuneLines>(EMPTY_RUNE_LINES)

  const value = {
    searchQuery,
    setSearchQuery,
    searchRuneState,
    setSearchRuneState,
  }

  return (
    <SearchStateContext.Provider value={value}>
      {children}
    </SearchStateContext.Provider>
  )
}

export function useSearchState() {
  const context = useContext(SearchStateContext)
  if (context === undefined) {
    throw new Error("useSearchState must be used within an AppStateProvider")
  }
  return context
}
