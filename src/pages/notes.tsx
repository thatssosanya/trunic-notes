import { useState, useMemo, useEffect, useCallback } from "react"
import { Rune, RuneData } from "@/types"
import { useConfig } from "@/context/ConfigContext"
import { SortableRuneCard } from "@/components/SortableRuneCard"
import RuneCard from "@/components/RuneCard"
import GridControls from "@/components/GridControls"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { ChevronDown, Loader2 } from "lucide-react"
import {
  CONSONANT_LINE_INDICES,
  GRID_COLS_CLASSES,
  VOWEL_LINE_INDICES,
} from "@/lib/consts"
import withAuthGating from "@/components/hoc/withAuthGating"

function Notes() {
  const {
    gridCols,
    searchQuery,
    searchRuneState,
    sortBy,
    isMenuOpen,
    setIsMenuOpen,
  } = useConfig()

  const [runes, setRunes] = useState<Rune[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addLocation, setAddLocation] = useState<"start" | "end" | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchRunes = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true)
    else setIsRefetching(true)

    try {
      const response = await fetch("/api/rune")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setRunes(data)
    } catch (error) {
      console.error("Failed to fetch runes:", error)
    } finally {
      if (isInitialLoad) setIsLoading(false)
      setIsRefetching(false)
    }
  }, [])

  useEffect(() => {
    fetchRunes(true)
  }, [fetchRunes])

  const handleAddNew = (location: "start" | "end") => {
    setEditingId(null)
    setAddLocation(location)
  }

  const handleCancel = () => {
    setEditingId(null)
    setAddLocation(null)
  }

  const handleSave = async (data: RuneData) => {
    const body = editingId ? { ...data, id: editingId } : data
    await fetch("/api/rune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    handleCancel()
    await fetchRunes()
  }
  const handleDelete = async (id: string) => {
    await fetch(`/api/rune?id=${id}`, { method: "DELETE" })
    await fetchRunes()
  }
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = runes.findIndex((item) => item.id === active.id)
      const newIndex = runes.findIndex((item) => item.id === over.id)
      const reorderedRunes = arrayMove(runes, oldIndex, newIndex)
      setRunes(reorderedRunes)
      const orderedIds = reorderedRunes.map((item) => item.id)
      await fetch("/api/rune", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      })
    }
  }

  const processedRunes = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    const activeSearchIndices = searchRuneState
      .map((val, idx) => (val ? idx : -1))
      .filter((idx) => idx !== -1)
    const isTextSearchActive = lowerCaseQuery.length > 0
    const isRuneSearchActive = activeSearchIndices.length > 0

    const baseFiltered = runes.filter((rune) => {
      const textMatch =
        !isTextSearchActive ||
        rune.translation.toLowerCase().includes(lowerCaseQuery) ||
        rune.note.toLowerCase().includes(lowerCaseQuery)
      const visualMatch =
        !isRuneSearchActive ||
        activeSearchIndices.every((searchIndex) => rune.lines[searchIndex])
      return textMatch && visualMatch
    })

    if (!isTextSearchActive && !isRuneSearchActive) {
      if (sortBy === "alpha") {
        return baseFiltered.toSorted((a, b) =>
          a.translation.localeCompare(b.translation)
        )
      }
      return baseFiltered
    }

    // prioritize more precise matches
    const priorityBuckets = {
      exactLine: [] as Rune[],
      exactText: [] as Rune[],
      prefixText: [] as Rune[],
      exactLineSingleType: [] as Rune[],
      remaining: [] as Rune[],
    }

    const isExactLineMatch = (runeLines: boolean[], indices: number[]) => {
      if (!isRuneSearchActive) return false
      return indices.every((i) => runeLines[i] === searchRuneState[i])
    }

    baseFiltered.forEach((rune) => {
      const translation = rune.translation.toLowerCase()
      if (isTextSearchActive && translation === lowerCaseQuery) {
        priorityBuckets.exactText.push(rune)
      } else if (isTextSearchActive && translation.startsWith(lowerCaseQuery)) {
        priorityBuckets.prefixText.push(rune)
      } else if (isRuneSearchActive) {
        const isExactVowelMatch = isExactLineMatch(
          rune.lines,
          VOWEL_LINE_INDICES
        )
        const isExactConsonantMatch = isExactLineMatch(
          rune.lines,
          CONSONANT_LINE_INDICES
        )
        if (isExactVowelMatch && isExactConsonantMatch) {
          priorityBuckets.exactLine.push(rune)
        } else if (isExactVowelMatch || isExactConsonantMatch) {
          priorityBuckets.exactLineSingleType.push(rune)
        }
        priorityBuckets.exactLine.push(rune)
      } else {
        priorityBuckets.remaining.push(rune)
      }
    })

    const sortedRemaining =
      sortBy === "alpha"
        ? priorityBuckets.remaining.toSorted((a, b) =>
            a.translation.localeCompare(b.translation)
          )
        : priorityBuckets.remaining

    return [
      ...priorityBuckets.exactLine,
      ...priorityBuckets.exactText,
      ...priorityBuckets.prefixText,
      ...priorityBuckets.exactLineSingleType,
      ...sortedRemaining,
    ]
  }, [runes, searchQuery, searchRuneState, sortBy])

  const isAnyFilterActive =
    searchQuery.length > 0 || searchRuneState.some((v) => v)
  const isDndDisabled =
    sortBy === "alpha" || isAnyFilterActive || addLocation !== null

  const AddNewButton = (
    <button
      onClick={() => handleAddNew("end")}
      className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400 cursor-pointer"
    >
      <span className="text-6xl font-thin">+</span>
    </button>
  )

  const NewRuneForm = (
    <RuneCard
      key="newRuneForm"
      isNew
      isEditing
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )

  const runeGrid = (
    <div
      className={`grid ${GRID_COLS_CLASSES[gridCols] || "grid-cols-8"} gap-4`}
    >
      {addLocation === "start" && NewRuneForm}
      {processedRunes.map((rune) => (
        <SortableRuneCard
          key={rune.id}
          rune={rune}
          isEditing={editingId === rune.id}
          onSave={handleSave}
          onCancel={handleCancel}
          onEdit={setEditingId}
          onDelete={handleDelete}
          isDndDisabled={isDndDisabled}
        />
      ))}
      {addLocation === "end"
        ? NewRuneForm
        : !isAnyFilterActive && !addLocation
        ? AddNewButton
        : null}
    </div>
  )

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white overflow-y-scroll">
      <div className="text-center mb-6">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center gap-3 group cursor-pointer"
        >
          <h1 className="text-4xl font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
            Trunic Notes
          </h1>
          <ChevronDown
            className={
              "text-cyan-400 transition-transform transform rotate-0" +
              (isMenuOpen ? " rotate-180" : "")
            }
          />
        </button>
      </div>

      {isMenuOpen && (
        <GridControls
          isModifying={!!editingId || !!addLocation}
          onAddNew={() => handleAddNew("start")}
        />
      )}

      <div className="relative">
        {isRefetching && (
          <div className="absolute inset-0 bg-gray-900/75 z-10 flex justify-center overflow-hidden rounded-lg transform">
            <div className="fixed top-1/2">
              <Loader2 className="h-12 w-12 text-cyan-300 animate-spin -translate-y-1/2" />
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-center">Loading notes...</p>
        ) : isDndDisabled ? (
          runeGrid
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={processedRunes.map((r) => r.id)}
              strategy={rectSortingStrategy}
            >
              {runeGrid}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </main>
  )
}

export default withAuthGating(Notes)
