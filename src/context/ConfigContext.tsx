import React, {
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react"
import usePersistedState from "@/hooks/usePersistedState"
import {
  EMPTY_RUNE_LINES,
  GRID_COLS_DESKTOP_DEFAULT,
  GRID_COLS_MOBILE_DEFAULT,
  GRID_COLS_OPTION,
} from "@/utils/consts"
import { useIsMobile } from "@/hooks/useMediaQuery"
import useCallbackUntilSignal from "@/hooks/useCallbackUntilSignal"
import { SortingOptions } from "@/utils/enums"

interface ConfigContextType {
  isMenuOpen: boolean
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>
  showInactiveLines: boolean
  setShowInactiveLines: Dispatch<SetStateAction<boolean>>
  isVerticalCards: boolean
  setIsVerticalCards: Dispatch<SetStateAction<boolean>>
  gridCols: GRID_COLS_OPTION
  setGridCols: Dispatch<SetStateAction<GRID_COLS_OPTION>>
  sortBy: SortingOptions
  setSortBy: Dispatch<SetStateAction<SortingOptions>>
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
  const [sortBy, setSortBy] = usePersistedState<SortingOptions>(
    "trunic-sort-by",
    SortingOptions.SEQUENCE
  )

  const isMobile = useIsMobile()
  const correctGridColsForMobile = useCallback(() => {
    if (isMobile === undefined) {
      return
    }
    if (isMobile && gridCols === GRID_COLS_DESKTOP_DEFAULT) {
      setGridCols(GRID_COLS_MOBILE_DEFAULT)
    }
  }, [isMobile, gridCols, setGridCols])
  useCallbackUntilSignal(correctGridColsForMobile)

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
