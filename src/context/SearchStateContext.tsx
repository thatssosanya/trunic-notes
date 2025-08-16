import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react"
import { EMPTY_RUNE_LINES } from "@/lib/consts"
import { RuneLines } from "@/types"

interface SearchStateContextType {
  isTextSearchActive: boolean
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  isRuneSearchActive: boolean
  searchRuneState: RuneLines
  activeSearchRuneIndices: number[]
  setSearchRuneState: Dispatch<SetStateAction<RuneLines>>
}

const SearchStateContext = createContext<SearchStateContextType | undefined>(
  undefined
)

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [_searchQuery, setSearchQuery] = useState("")
  const searchQuery = useMemo(() => _searchQuery.toLowerCase(), [_searchQuery])
  const isTextSearchActive = useMemo(
    () => _searchQuery.length > 0,
    [_searchQuery]
  )

  const [searchRuneState, setSearchRuneState] =
    useState<RuneLines>(EMPTY_RUNE_LINES)
  const activeSearchRuneIndices = useMemo(
    () =>
      searchRuneState
        .map((val, idx) => (val ? idx : -1))
        .filter((idx) => idx !== -1),
    [searchRuneState]
  )
  const isRuneSearchActive = useMemo(
    () => searchRuneState.some((v) => v),
    [searchRuneState]
  )

  const value = {
    isTextSearchActive,
    searchQuery,
    setSearchQuery,
    isRuneSearchActive,
    searchRuneState,
    activeSearchRuneIndices,
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
