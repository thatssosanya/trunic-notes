import { useConfig } from "@/context/ConfigContext"
import RuneEditor from "@/components/runes/RuneEditor"
import { PlusSquare, Search, X } from "lucide-react"
import { useEffect, useRef } from "react"
import {
  EMPTY_RUNE_LINES,
  GRID_COLS_MOBILE_OPTIONS,
  GRID_COLS_OPTIONS,
} from "@/utils/consts"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { useAppState } from "@/context/AppStateContext"
import { EditState, SortingOption, ThemeOption } from "@/utils/enums"
import { useSearchState } from "@/context/SearchStateContext"
import IconButton from "./common/IconButton"
import { ButtonColor, cn } from "@/styles"

const buttonBaseClass = "px-3 py-1 text-sm rounded cursor-pointer"
const buttonActiveClass = "bg-accent hover:bg-accent-highlight"
const buttonInactiveClass = "bg-muted hover:bg-muted-highlight"

export default function ConfigControls() {
  const {
    isTextSearchActive,
    searchQuery,
    setSearchQuery,
    isRuneSearchActive,
    searchRuneState,
    setSearchRuneState,
  } = useSearchState()
  const {
    gridCols,
    setGridCols,
    sortBy,
    setSortBy,
    showInactiveLines,
    setShowInactiveLines,
    theme,
    setTheme,
  } = useConfig()
  const { editState, addRune } = useAppState()

  const searchInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (editState !== EditState.IDLE) {
        return
      }
      if (event.key === "Escape") {
        setSearchQuery("")
        setSearchRuneState(EMPTY_RUNE_LINES)
      } else if (event.key.length === 1) {
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [editState, setSearchQuery, setSearchRuneState])

  return (
    <div className="bg-card border-2 border-primary p-4 rounded-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:max-w-lg 2xl:max-w-2xl lg:mx-auto relative">
      <div className="relative">
        <Search
          className={cn(
            "absolute top-1 left-1",
            isRuneSearchActive ? "text-accent" : "text-muted"
          )}
          size={20}
        />
        <div className="w-full max-w-[10rem] mx-auto">
          <RuneEditor
            isEditing={true}
            runeState={searchRuneState}
            setRuneState={setSearchRuneState}
          />
        </div>
        {isRuneSearchActive && (
          <button
            onClick={() => setSearchRuneState(EMPTY_RUNE_LINES)}
            className="absolute top-1 right-1 text-muted hover:text-danger cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="md:col-span-2 flex flex-col justify-between gap-4">
        <div className="relative flex items-center">
          <Search
            className={cn(
              "absolute left-3",
              isTextSearchActive ? "text-accent" : "text-muted"
            )}
          />
          <input
            type="text"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search translations and notes..."
            className="w-full p-2 pl-10 pr-10 bg-input border border-primary rounded-md"
          />
          {isTextSearchActive && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-muted hover:text-danger cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">Columns:</span>
          <div className="flex flex-wrap gap-1">
            {(isMobile ? GRID_COLS_MOBILE_OPTIONS : GRID_COLS_OPTIONS).map(
              (num) => (
                <button
                  key={num}
                  onClick={() => setGridCols(num)}
                  className={cn(
                    "w-5 h-5 text-xs rounded cursor-pointer",
                    gridCols === num ? buttonActiveClass : buttonInactiveClass
                  )}
                >
                  {num}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">Sorting:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(SortingOption.ALPHA)}
              className={cn(
                buttonBaseClass,
                sortBy === SortingOption.ALPHA
                  ? buttonActiveClass
                  : buttonInactiveClass
              )}
            >
              Alpha
            </button>
            <button
              onClick={() => setSortBy(SortingOption.SEQUENCE)}
              className={cn(
                buttonBaseClass,
                sortBy === SortingOption.SEQUENCE
                  ? buttonActiveClass
                  : buttonInactiveClass
              )}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">Theme:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(ThemeOption.LIGHT)}
              className={cn(
                buttonBaseClass,
                theme === ThemeOption.LIGHT
                  ? buttonActiveClass
                  : buttonInactiveClass
              )}
            >
              Tunic
            </button>
            <button
              onClick={() => setTheme(ThemeOption.DARK)}
              className={cn(
                buttonBaseClass,
                theme === ThemeOption.DARK
                  ? buttonActiveClass
                  : buttonInactiveClass
              )}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme(ThemeOption.DEVICE)}
              className={cn(
                buttonBaseClass,
                theme === ThemeOption.DEVICE
                  ? buttonActiveClass
                  : buttonInactiveClass
              )}
            >
              Device
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">Show lines:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInactiveLines(false)}
              className={cn(
                buttonBaseClass,
                !showInactiveLines ? buttonActiveClass : buttonInactiveClass
              )}
            >
              Active
            </button>
            <button
              onClick={() => setShowInactiveLines(true)}
              className={cn(
                buttonBaseClass,
                showInactiveLines ? buttonActiveClass : buttonInactiveClass
              )}
            >
              All
            </button>
          </div>
        </div>

        {editState === EditState.IDLE && (
          <IconButton
            Icon={PlusSquare}
            color={ButtonColor.GRAY}
            onClick={addRune}
            title="Add New Rune to Top"
            className="absolute bottom-4 right-4 hover:bg-accent-highlight"
          />
        )}
      </div>
    </div>
  )
}
