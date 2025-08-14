import React, {
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react"
import usePersistedState from "@/hooks/usePersistedState"
import {
  EMPTY_RUNE_LINES,
  GRID_COLS_DESKTOP_DEFAULT,
  GRID_COLS_MOBILE_DEFAULT,
  GRID_COLS_OPTION,
} from "@/lib/consts"
import { useIsMobile } from "@/hooks/useMediaQuery"
import useCallbackOnce from "@/hooks/useCallbackOnce"
import { RuneLines } from "@/types"

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
  searchRuneState: RuneLines
  setSearchRuneState: Dispatch<SetStateAction<RuneLines>>
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
    GRID_COLS_DESKTOP_DEFAULT
  )
  const [searchQuery, setSearchQuery] = usePersistedState(
    "trunic-search-query",
    ""
  )
  const [searchRuneState, setSearchRuneState] = usePersistedState(
    "trunic-search-rune",
    EMPTY_RUNE_LINES
  )
  const [sortBy, setSortBy] = usePersistedState<"sequence" | "alpha">(
    "trunic-sort-by",
    "sequence"
  )

  const isMobile = useIsMobile()
  useCallbackOnce(() => {
    if (isMobile === undefined) {
      return
    }
    if (isMobile && gridCols === GRID_COLS_DESKTOP_DEFAULT) {
      setGridCols(GRID_COLS_MOBILE_DEFAULT)
    }
  })

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
