import React, {
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react"
import usePersistedState from "@/hooks/usePersistedState"
import { GRID_COLS_OPTION, LINES_IN_RUNE } from "@/lib/consts"

interface ConfigContextType {
  isMenuOpen: boolean
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>
  showInactiveLines: boolean
  setShowInactiveLines: Dispatch<SetStateAction<boolean>>
  isVerticalCards: boolean
  setIsVerticalCards: Dispatch<SetStateAction<boolean>>
  gridCols: GRID_COLS_OPTION
  setGridCols: Dispatch<SetStateAction<GRID_COLS_OPTION>>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  searchRuneState: boolean[]
  setSearchRuneState: Dispatch<SetStateAction<boolean[]>>
  sortBy: "sequence" | "alpha"
  setSortBy: Dispatch<SetStateAction<"sequence" | "alpha">>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = usePersistedState(
    "trunic-menu-open",
    false
  )
  const [showInactiveLines, setShowInactiveLines] = usePersistedState(
    "trunic-show-inactive-lines",
    false
  )
  const [isVerticalCards, setIsVerticalCards] = usePersistedState(
    "trunic-card-style",
    true
  )
  const [gridCols, setGridCols] = usePersistedState<GRID_COLS_OPTION>(
    "trunic-grid-cols",
    "8"
  )
  const [searchQuery, setSearchQuery] = usePersistedState(
    "trunic-search-query",
    ""
  )
  const [searchRuneState, setSearchRuneState] = usePersistedState(
    "trunic-search-rune",
    new Array(LINES_IN_RUNE).fill(false)
  )
  const [sortBy, setSortBy] = usePersistedState<"sequence" | "alpha">(
    "trunic-sort-by",
    "sequence"
  )

  const value = {
    isMenuOpen,
    setIsMenuOpen,
    showInactiveLines,
    setShowInactiveLines,
    isVerticalCards,
    setIsVerticalCards,
    gridCols,
    setGridCols,
    searchQuery,
    setSearchQuery,
    searchRuneState,
    setSearchRuneState,
    sortBy,
    setSortBy,
  }

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return context
}
