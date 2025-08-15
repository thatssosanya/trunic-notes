import { useConfig } from "@/context/ConfigContext"
import RuneEditor from "@/components/runes/RuneEditor"
import { PlusSquare, Search, X } from "lucide-react"
import { useEffect, useRef } from "react"
import {
  EMPTY_RUNE_LINES,
  GRID_COLS_MOBILE_OPTIONS,
  GRID_COLS_OPTIONS,
} from "@/lib/consts"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { useAppState } from "@/context/AppStateContext"
import { EditStates, SortingOptions } from "@/lib/enums"

const buttonBaseClass = "px-3 py-1 text-sm rounded cursor-pointer"
const buttonActiveClass = "bg-cyan-600 text-white"
const buttonInactiveClass = "bg-gray-700 hover:bg-gray-600"

export default function ConfigControls() {
  const {
    gridCols,
    setGridCols,
    isVerticalCards,
    setIsVerticalCards,
    sortBy,
    setSortBy,
    showInactiveLines,
    setShowInactiveLines,
  } = useConfig()
  const {
    searchRuneState,
    setSearchRuneState,
    searchQuery,
    setSearchQuery,
    editState,
    addRune,
  } = useAppState()

  const isRuneSearchActive = searchRuneState.some((v) => v)
  const isTextSearchActive = searchQuery.length > 0

  const searchInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (editState !== EditStates.IDLE) {
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
    <div className="bg-gray-800 p-4 rounded-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:max-w-lg 2xl:max-w-2xl lg:mx-auto relative">
      <div className="relative">
        <Search
          className={`absolute top-1 left-1 ${
            isRuneSearchActive ? "text-cyan-300" : "text-gray-500"
          }`}
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
            className="absolute top-1 right-1 text-gray-400 hover:text-red-400 cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="md:col-span-2 flex flex-col justify-between gap-4">
        <div className="relative flex items-center">
          <Search
            className={`absolute left-3 ${
              isTextSearchActive ? "text-cyan-300" : "text-gray-500"
            }`}
          />
          <input
            type="text"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search translations and notes..."
            className="w-full p-2 pl-10 pr-10 bg-gray-900 border border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          {isTextSearchActive && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-gray-400 hover:text-red-400 cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Columns:</span>
          <div className="flex flex-wrap gap-1">
            {(isMobile ? GRID_COLS_MOBILE_OPTIONS : GRID_COLS_OPTIONS).map(
              (num) => (
                <button
                  key={num}
                  onClick={() => setGridCols(num)}
                  className={`w-5 h-5 text-xs rounded cursor-pointer ${
                    gridCols === num ? buttonActiveClass : buttonInactiveClass
                  }`}
                >
                  {num}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Cards:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsVerticalCards(true)}
              className={`${buttonBaseClass} ${
                isVerticalCards ? buttonActiveClass : buttonInactiveClass
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => setIsVerticalCards(false)}
              className={`${buttonBaseClass} ${
                !isVerticalCards ? buttonActiveClass : buttonInactiveClass
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Show Lines:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInactiveLines(false)}
              className={`${buttonBaseClass} ${
                !showInactiveLines ? buttonActiveClass : buttonInactiveClass
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowInactiveLines(true)}
              className={`${buttonBaseClass} ${
                showInactiveLines ? buttonActiveClass : buttonInactiveClass
              }`}
            >
              All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Sorting:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(SortingOptions.ALPHA)}
              className={`${buttonBaseClass} ${
                sortBy === SortingOptions.ALPHA
                  ? buttonActiveClass
                  : buttonInactiveClass
              }`}
            >
              Alpha
            </button>
            <button
              onClick={() => setSortBy(SortingOptions.SEQUENCE)}
              className={`${buttonBaseClass} ${
                sortBy === SortingOptions.SEQUENCE
                  ? buttonActiveClass
                  : buttonInactiveClass
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {editState === EditStates.IDLE && (
          <button
            onClick={addRune}
            title="Add New Rune to Top"
            className="absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-cyan-600 text-white rounded-lg cursor-pointer"
          >
            <PlusSquare size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
