import React, {
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
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
import { SortingOption, ThemeOption } from "@/utils/enums"

interface ConfigContextType {
  isMenuOpen: boolean
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>
  showInactiveLines: boolean
  setShowInactiveLines: Dispatch<SetStateAction<boolean>>
  gridCols: GRID_COLS_OPTION
  setGridCols: Dispatch<SetStateAction<GRID_COLS_OPTION>>
  sortBy: SortingOption
  setSortBy: Dispatch<SetStateAction<SortingOption>>
  theme: ThemeOption
  setTheme: Dispatch<SetStateAction<ThemeOption>>
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
  const [sortBy, setSortBy] = usePersistedState<SortingOption>(
    "trunic-sort-by",
    SortingOption.SEQUENCE
  )
  const [theme, setTheme] = usePersistedState<ThemeOption>(
    "trunic-theme",
    ThemeOption.DEVICE
  )

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme === ThemeOption.DARK ||
      (theme === ThemeOption.DEVICE &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light"
  }, [theme])

  const isMobile = useIsMobile()
  // if on mobile and grid cols is desktop default, reset to mobile default
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
    gridCols,
    setGridCols,
    searchQuery,
    setSearchQuery,
    searchRuneState,
    setSearchRuneState,
    sortBy,
    setSortBy,
    theme,
    setTheme,
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
