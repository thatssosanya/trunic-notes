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
import { EditState, RuneNewFormLocation, SortingOption } from "@/utils/enums"
import { isExactLineMatch } from "@/utils/runes"
import { cn, GRID_COLS_CLASSES } from "@/styles"
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

  const { data: runes = [], isLoading, isError } = useRunes()
  const updateRuneOrderMutation = useUpdateRuneOrder()

  const [newFormLocation, setNewFormLocation] =
    useState<RuneNewFormLocation | null>(null)
  const [isNewFormEditing, setIsNewFormEditing] = useState(false)
  useEffect(() => {
    if (editState === EditState.ADDING_RUNE && !newFormLocation) {
      setNewFormLocation(RuneNewFormLocation.START)
      setIsNewFormEditing(false)
    } else if (editState !== EditState.ADDING_RUNE) {
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
      if (sortBy === SortingOption.ALPHA) {
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
      sortBy === SortingOption.ALPHA
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
    setNewFormLocation(RuneNewFormLocation.END)
    addRune()
  }

  const isAnySearchActive = isTextSearchActive || isRuneSearchActive
  const isDndDisabled =
    sortBy === SortingOption.ALPHA ||
    isAnySearchActive ||
    editState !== EditState.IDLE

  const AddNewButton = (
    <button
      onClick={handleAdd}
      className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-primary hover:border-accent rounded-lg transition-colors text-muted hover:text-accent cursor-pointer"
    >
      <span className="text-6xl font-thin">+</span>
    </button>
  )

  const NewRuneForm =
    newFormLocation === RuneNewFormLocation.END || isNewFormEditing ? (
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
      className={cn("grid gap-4", GRID_COLS_CLASSES[gridCols] || "grid-cols-8")}
    >
      {editState === EditState.ADDING_RUNE &&
        newFormLocation === RuneNewFormLocation.START &&
        NewRuneForm}
      {processedRunes.map((rune) => {
        const isEditingThis =
          editState === EditState.EDITING_RUNE && editingId === rune.id
        return (
          <SortableRuneCard
            key={rune.id}
            rune={rune}
            isEditing={isEditingThis}
            onEdit={editRune}
            onCancel={cancelEdit}
            isOtherFormActive={editState !== EditState.IDLE && !isEditingThis}
            onAddRuneForChain={
              editState === EditState.ADDING_CHAIN ||
              editState === EditState.EDITING_CHAIN
                ? onAddRuneForChain
                : undefined
            }
            shouldScroll={rune.id === runeIdToScroll}
            onScrollComplete={onScrollComplete}
            isDndDisabled={isDndDisabled}
          />
        )
      })}
      {editState === EditState.ADDING_RUNE &&
      newFormLocation === RuneNewFormLocation.END
        ? NewRuneForm
        : !isAnySearchActive && editState === EditState.IDLE
        ? AddNewButton
        : null}
    </div>
  )

  return (
    <div className="relative">
      <h2 className="text-2xl text-center font-bold text-secondary mb-4">
        Runes
      </h2>
      {isError ? (
        <p className="text-center mb-4 text-danger">
          Couldn&apos;t load runes: An error occurred
        </p>
      ) : isLoading ? (
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
