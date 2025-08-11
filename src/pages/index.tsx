import { useState, useMemo, useEffect, useCallback } from "react"
import { Rune } from "@/types"
import RuneCard from "@/components/RuneCard"
import { SortableRuneCard } from "@/components/SortableRuneCard"

// DND-Kit Imports
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

// --- Constants ---
const GRID_COLS_OPTIONS = [2, 4, 6, 8, 10]
const GRID_COLS_MAP: { [key: number]: string } = {
  2: "grid-cols-2",
  4: "grid-cols-4",
  6: "grid-cols-6",
  8: "grid-cols-8",
  10: "grid-cols-10",
}

// --- Component ---
export default function Home() {
  // --- State ---
  const [runes, setRunes] = useState<Rune[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [gridColsIndex, setGridColsIndex] = useState(1) // Default to index 1 (4 columns)

  // --- DND-Kit Setup ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // --- Data Fetching & Side Effects ---
  const fetchRunes = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/rune")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setRunes(data)
    } catch (error) {
      console.error("Failed to fetch runes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRunes()
    const savedColsIndex = localStorage.getItem("trunic-grid-cols-index")
    if (savedColsIndex) {
      const index = parseInt(savedColsIndex, 10)
      if (index >= 0 && index < GRID_COLS_OPTIONS.length) {
        setGridColsIndex(index)
      }
    }
  }, [fetchRunes])

  // --- Event Handlers ---
  const handleGridCycle = () => {
    const nextIndex = (gridColsIndex + 1) % GRID_COLS_OPTIONS.length
    setGridColsIndex(nextIndex)
    localStorage.setItem("trunic-grid-cols-index", nextIndex.toString())
  }

  const handleAddNew = () => {
    setEditingId(null)
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSave = async (data: Omit<Rune, "id" | "sequence">) => {
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
      // 1. Optimistic UI update for a snappy feel
      const oldIndex = runes.findIndex((item) => item.id === active.id)
      const newIndex = runes.findIndex((item) => item.id === over.id)
      const reorderedRunes = arrayMove(runes, oldIndex, newIndex)
      setRunes(reorderedRunes)

      // 2. Persist the new order to the database
      const orderedIds = reorderedRunes.map((item) => item.id)
      await fetch("/api/rune", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      })
    }
  }

  // --- Memoization for Filtering ---
  const filteredRunes = useMemo(() => {
    if (!searchQuery) return runes
    const lowerCaseQuery = searchQuery.toLowerCase()
    return runes.filter((rune) => {
      const translation = rune.translation.toLowerCase()
      if (lowerCaseQuery.length === 1)
        return translation.includes(lowerCaseQuery)
      const note = rune.note.toLowerCase()
      return (
        translation.includes(lowerCaseQuery) || note.includes(lowerCaseQuery)
      )
    })
  }, [runes, searchQuery])

  // --- Render ---
  const addNewButton = (
    <button
      onClick={handleAddNew}
      className="flex items-center justify-center w-full h-full border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400"
    >
      <span className="text-6xl font-thin">+</span>
    </button>
  )

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="relative text-center mb-8">
        <h1 className="text-4xl font-bold text-cyan-300">Trunic Notes</h1>
        <div className="mt-4 max-w-lg mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search translations and notes..."
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
        <div className="absolute top-0 right-0">
          <button
            onClick={handleGridCycle}
            title="Cycle Grid Columns"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
          >
            Grid: {GRID_COLS_OPTIONS[gridColsIndex]}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center">Loading your lexicon...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredRunes.map((r) => r.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className={`grid ${
                GRID_COLS_MAP[GRID_COLS_OPTIONS[gridColsIndex]]
              } gap-6`}
            >
              {filteredRunes.map((rune) => (
                <SortableRuneCard
                  key={rune.id}
                  rune={rune}
                  isEditing={editingId === rune.id}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onEdit={setEditingId}
                  onDelete={handleDelete}
                />
              ))}
              {isAdding ? (
                <div>
                  <RuneCard
                    isNew
                    isEditing
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </div>
              ) : !searchQuery ? (
                addNewButton
              ) : null}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </main>
  )
}
