import { useState, useMemo, useEffect } from "react"
import { useConfig } from "@/context/ConfigContext"
import SortableRuneCard from "@/components/runes/card/SortableRuneCard"
import RuneCard from "@/components/runes/card"
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import {
  CONSONANT_LINE_INDICES,
  EMPTY_RUNE_DATA,
  VOWEL_LINE_INDICES,
} from "@/utils/consts"
import { useRunes, useUpdateRuneOrder } from "@/hooks/data/runes"
import { Rune, RuneLines } from "@/types"
import { useAppState } from "@/context/AppStateContext"
import { EditStates, RuneNewFormLocations, SortingOptions } from "@/utils/enums"
import { isExactLineMatch } from "@/utils/runes"
import { GRID_COLS_CLASSES } from "@/styles"
import { useSearchState } from "@/context/SearchStateContext"

type RuneCollectionProps = {
  copiedRune: RuneLines | null
  onAddRuneForChain: (lines: RuneLines) => void
  runeIdToScroll: string | null
  onScrollComplete: () => void
}

export default function RuneCollection({
  copiedRune,
  onAddRuneForChain,
  runeIdToScroll,
  onScrollComplete,
}: RuneCollectionProps) {
  const { gridCols, sortBy } = useConfig()
  const {
    isTextSearchActive,
    searchQuery,
    isRuneSearchActive,
    searchRuneState,
    activeSearchRuneIndices,
  } = useSearchState()
  const { editingId, editState, cancelEdit, addRune, editRune } = useAppState()

  const { data: runes = [], isLoading } = useRunes()
  const updateRuneOrderMutation = useUpdateRuneOrder()

  const [newFormLocation, setNewFormLocation] =
    useState<RuneNewFormLocations | null>(null)
  const [isNewFormEditing, setIsNewFormEditing] = useState(false)
  useEffect(() => {
    if (editState === EditStates.ADDING_RUNE && !newFormLocation) {
      setNewFormLocation(RuneNewFormLocations.START)
      setIsNewFormEditing(false)
    } else if (editState !== EditStates.ADDING_RUNE) {
      // handle adding cancelation
      setNewFormLocation(null)
      setIsNewFormEditing(false)
    }
  }, [editState, newFormLocation])

  const newRuneTemplate = useMemo(
    () =>
      copiedRune ? { ...EMPTY_RUNE_DATA, lines: copiedRune } : EMPTY_RUNE_DATA,
    [copiedRune]
  )

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    })
  )

  const processedRunes = useMemo(() => {
    const baseFiltered = runes.filter((rune) => {
      const textMatch =
        !isTextSearchActive ||
        rune.translation.toLowerCase().includes(searchQuery) ||
        rune.note.toLowerCase().includes(searchQuery)
      const visualMatch =
        !isRuneSearchActive ||
        activeSearchRuneIndices.every((searchIndex) => rune.lines[searchIndex])
      return textMatch && visualMatch
    })

    if (!isTextSearchActive && !isRuneSearchActive) {
      if (sortBy === SortingOptions.ALPHA) {
        return baseFiltered.toSorted((a, b) =>
          a.translation.localeCompare(b.translation)
        )
      }
      return baseFiltered
    }

    // prioritize more precise matches
    const priorityBuckets = {
      exact: [] as Rune[],
      exactLine: [] as Rune[],
      exactText: [] as Rune[],
      prefixText: [] as Rune[],
      exactLineSingleType: [] as Rune[],
      remaining: [] as Rune[],
    }

    baseFiltered.forEach((rune) => {
      const translation = rune.translation.toLowerCase()

      const isExactText = isTextSearchActive && translation === searchQuery
      const isPrefixText =
        isTextSearchActive && translation.startsWith(searchQuery)
      const isExactVowel =
        isRuneSearchActive &&
        isExactLineMatch(rune.lines, searchRuneState, VOWEL_LINE_INDICES)
      const isExactConsonant =
        isRuneSearchActive &&
        isExactLineMatch(rune.lines, searchRuneState, CONSONANT_LINE_INDICES)

      if (isExactText && isExactVowel && isExactConsonant) {
        priorityBuckets.exact.push(rune)
      } else if (isExactVowel && isExactConsonant) {
        priorityBuckets.exactLine.push(rune)
      } else if (isExactText) {
        priorityBuckets.exactText.push(rune)
      } else if (isPrefixText) {
        priorityBuckets.prefixText.push(rune)
      } else if (isExactVowel || isExactConsonant) {
        priorityBuckets.exactLineSingleType.push(rune)
      } else {
        priorityBuckets.remaining.push(rune)
      }
    })

    const sortedRemaining =
      sortBy === SortingOptions.ALPHA
        ? priorityBuckets.remaining.toSorted((a, b) =>
            a.translation.localeCompare(b.translation)
          )
        : priorityBuckets.remaining

    return [
      ...priorityBuckets.exact,
      ...priorityBuckets.exactLine,
      ...priorityBuckets.exactText,
      ...priorityBuckets.prefixText,
      ...priorityBuckets.exactLineSingleType,
      ...sortedRemaining,
    ]
  }, [
    runes,
    isTextSearchActive,
    searchQuery,
    isRuneSearchActive,
    searchRuneState,
    activeSearchRuneIndices,
    sortBy,
  ])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = runes.findIndex((item) => item.id === active.id)
      const newIndex = runes.findIndex((item) => item.id === over.id)
      const reorderedRunes = arrayMove(runes, oldIndex, newIndex)
      const orderedIds = reorderedRunes.map((item) => item.id)
      updateRuneOrderMutation.mutate(orderedIds)
    }
  }

  const handleAdd = () => {
    setNewFormLocation(RuneNewFormLocations.END)
    addRune()
  }

  const isAnySearchActive = isTextSearchActive || isRuneSearchActive
  const isDndDisabled =
    sortBy === SortingOptions.ALPHA ||
    isAnySearchActive ||
    editState !== EditStates.IDLE

  const AddNewButton = (
    <button
      onClick={handleAdd}
      className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400 cursor-pointer"
    >
      <span className="text-6xl font-thin">+</span>
    </button>
  )

  const NewRuneForm =
    newFormLocation === RuneNewFormLocations.END || isNewFormEditing ? (
      <RuneCard
        key="newRuneForm"
        rune={newRuneTemplate}
        isEditing
        onCancel={cancelEdit}
      />
    ) : (
      <RuneCard
        key="newRuneForm"
        rune={{ ...newRuneTemplate, id: "newRuneForm" }}
        shouldScroll
        onScrollComplete={() => setIsNewFormEditing(true)}
        isEditing={false}
        onCancel={cancelEdit}
      />
    )

  const runeGrid = (
    <div
      className={`grid ${GRID_COLS_CLASSES[gridCols] || "grid-cols-8"} gap-4`}
    >
      {editState === EditStates.ADDING_RUNE &&
        newFormLocation === RuneNewFormLocations.START &&
        NewRuneForm}
      {processedRunes.map((rune) => {
        const isEditingThis =
          editState === EditStates.EDITING_RUNE && editingId === rune.id
        return (
          <SortableRuneCard
            key={rune.id}
            rune={rune}
            isEditing={isEditingThis}
            onEdit={editRune}
            onCancel={cancelEdit}
            isOtherFormActive={editState !== EditStates.IDLE && !isEditingThis}
            onAddRuneForChain={
              editState === EditStates.ADDING_CHAIN ||
              editState === EditStates.EDITING_CHAIN
                ? onAddRuneForChain
                : undefined
            }
            shouldScroll={rune.id === runeIdToScroll}
            onScrollComplete={onScrollComplete}
            isDndDisabled={isDndDisabled}
          />
        )
      })}
      {editState === EditStates.ADDING_RUNE &&
      newFormLocation === RuneNewFormLocations.END
        ? NewRuneForm
        : !isAnySearchActive && editState === EditStates.IDLE
        ? AddNewButton
        : null}
    </div>
  )

  return (
    <div className="relative">
      {/* TODO
      {isRefetching && (
        <div className="absolute inset-0 bg-gray-900/75 z-10 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-cyan-300 animate-spin" />
        </div>
      )} */}
      <h2 className="text-2xl text-center font-bold text-gray-300 mb-4">
        Runes
      </h2>
      {isLoading ? (
        <p className="text-center mb-4">Loading runes...</p>
      ) : isAnySearchActive && !processedRunes.length ? (
        <div className="w-full text-center text-lg pt-4">
          Nothing matched your search
        </div>
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
  )
}
