import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Chain, ChainData, Rune, RuneData, RuneLines } from "@/types"
import { useConfig } from "@/context/ConfigContext"
import { SortableRuneCard } from "@/components/SortableRuneCard"
import RuneCard from "@/components/RuneCard"
import GridControls from "@/components/GridControls"
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
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import {
  CONSONANT_LINE_INDICES,
  GRID_COLS_CLASSES,
  VOWEL_LINE_INDICES,
  EMPTY_RUNE_LINES,
} from "@/lib/consts"
import withAuthGating from "@/components/hoc/withAuthGating"
import { signOut } from "next-auth/react"
import ChainCard from "@/components/ChainCard"
import usePersistedState from "@/hooks/usePersistedState"

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
  const [chains, setChains] = useState<Chain[]>([])

  const [isRunesLoading, setIsRunesLoading] = useState(true)
  const [isRunesRefetching, setIsRunesRefetching] = useState(false)
  const [isChainsLoading, setIsChainsLoading] = useState(true)
  const [isChainsRefetching, setIsChainsRefetching] = useState(false)
  const [showChainsSection, setShowChainsSection] = usePersistedState(
    "trunic-show-chains-section",
    false
  )

  const [runeEditingId, setRuneEditingId] = useState<string | null>(null)
  const [newRuneTemplate, setNewRuneTemplate] = useState<Rune | null>(null)
  const [newRuneFormLocation, setNewRuneFormLocation] = useState<
    "start" | "end" | null
  >(null)
  const [showNewChainForm, setShowNewChainForm] = useState(false)
  const [chainEditingId, setChainEditingId] = useState<string | null>(null)
  const [chainRuneToAdd, setChainRuneToAdd] = useState<RuneLines | null>(null)

  const runeTitleRef = useRef<HTMLDivElement | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    })
  )

  const fetchRunes = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsRunesLoading(true)
    else setIsRunesRefetching(true)

    try {
      const response = await fetch("/api/rune")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setRunes(data)
    } catch (error) {
      console.error("Failed to fetch runes:", error)
    } finally {
      if (isInitialLoad) setIsRunesLoading(false)
      setIsRunesRefetching(false)
    }
  }, [])

  const fetchChains = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsChainsLoading(true)
    else setIsChainsRefetching(true)

    try {
      const response = await fetch("/api/chain")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setChains(data)
    } catch (error) {
      console.error("Failed to fetch runes:", error)
    } finally {
      if (isInitialLoad) setIsChainsLoading(false)
      setIsChainsRefetching(false)
    }
  }, [])

  useEffect(() => {
    fetchRunes(true)
    fetchChains(true)
  }, [fetchRunes, fetchChains])

  const handleAddNewRune = (
    location: "start" | "end",
    template?: RuneLines
  ) => {
    setRuneEditingId(null)
    setNewRuneFormLocation(location)
    setNewRuneTemplate(
      template
        ? {
            id: "",
            userId: "",
            sequence: 0,
            lines: template,
            translation: "",
            note: "",
            isConfident: true,
          }
        : null
    )
  }
  const handleCopyChainRuneToNew = (rune: RuneLines) => {
    handleAddNewRune("start", rune)
    runeTitleRef.current?.scrollIntoView()
  }
  const handleCopyRuneToChain = (rune: RuneLines) => {
    setChainRuneToAdd(rune)
  }
  const handleCancelForms = () => {
    setRuneEditingId(null)
    setNewRuneFormLocation(null)
    setChainEditingId(null)
    setNewRuneTemplate(null)
    setChainEditingId(null)
    setChainRuneToAdd(null)
    setShowNewChainForm(false)
  }

  const handleSaveRune = async (data: RuneData) => {
    const body = runeEditingId ? { ...data, id: runeEditingId } : data
    await fetch("/api/rune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    handleCancelForms()
    await fetchRunes()
  }
  const handleDeleteRune = async (id: string) => {
    await fetch(`/api/rune?id=${id}`, { method: "DELETE" })
    await fetchRunes()
  }
  const handleSaveChain = async (data: ChainData) => {
    const body = chainEditingId ? { ...data, id: chainEditingId } : data
    const method = chainEditingId ? "PUT" : "POST"
    await fetch("/api/chain", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    handleCancelForms()
    await fetchChains()
  }
  const handleDeleteChain = async (id: string) => {
    await fetch(`/api/chain?id=${id}`, { method: "DELETE" })
    await fetchChains()
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
      exact: [] as Rune[],
      exactLine: [] as Rune[],
      exactText: [] as Rune[],
      prefixText: [] as Rune[],
      exactLineSingleType: [] as Rune[],
      remaining: [] as Rune[],
    }

    const isExactLineMatch = (a: boolean[], b: boolean[], indices: number[]) => {
      if (!isRuneSearchActive) return false
      return indices.every((i) => a[i] === b[i])
    }

    baseFiltered.forEach((rune) => {
      const translation = rune.translation.toLowerCase()

      const isExactText = isTextSearchActive && translation === lowerCaseQuery
      const isPrefixText = isTextSearchActive && translation.startsWith(lowerCaseQuery)
      const isExactVowel = isRuneSearchActive && !isExactLineMatch(rune.lines, EMPTY_RUNE_LINES, VOWEL_LINE_INDICES) && isExactLineMatch(rune.lines, searchRuneState, VOWEL_LINE_INDICES)
      const isExactConsonant = isRuneSearchActive && !isExactLineMatch(rune.lines, EMPTY_RUNE_LINES, CONSONANT_LINE_INDICES) && isExactLineMatch(rune.lines, searchRuneState, CONSONANT_LINE_INDICES)

      if (isExactText && isExactVowel && isExactConsonant) {
        priorityBuckets.exact.push(rune);
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
      sortBy === "alpha"
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
  }, [runes, searchQuery, searchRuneState, sortBy])

  const isAnyFilterActive =
    searchQuery.length > 0 || searchRuneState.some((v) => v)
  const isDndDisabled =
    sortBy === "alpha" ||
    isAnyFilterActive ||
    newRuneFormLocation !== null ||
    showNewChainForm ||
    !!chainEditingId

  const AddNewButton = (
    <button
      onClick={() => handleAddNewRune("end")}
      className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400 cursor-pointer"
    >
      <span className="text-6xl font-thin">+</span>
    </button>
  )

  const NewRuneForm = (
    <RuneCard
      key="newRuneForm"
      rune={newRuneTemplate ?? undefined}
      isEditing
      onSave={handleSaveRune}
      onCancel={handleCancelForms}
    />
  )

  const runeGrid = (
    <div
      className={`grid ${GRID_COLS_CLASSES[gridCols] || "grid-cols-8"} gap-4`}
    >
      {newRuneFormLocation === "start" && NewRuneForm}
      {processedRunes.map((rune) => (
        <SortableRuneCard
          key={rune.id}
          rune={rune}
          isEditing={runeEditingId === rune.id}
          onSave={handleSaveRune}
          onCancel={handleCancelForms}
          onEdit={setRuneEditingId}
          onDelete={handleDeleteRune}
          onAddToChain={
            showNewChainForm || !!chainEditingId
              ? handleCopyRuneToChain
              : undefined
          }
          isDndDisabled={isDndDisabled}
        />
      ))}
      {newRuneFormLocation === "end"
        ? NewRuneForm
        : !isAnyFilterActive && !newRuneFormLocation
        ? AddNewButton
        : null}
    </div>
  )

  return (
    <main className="min-h-screen flex flex-col p-8 bg-gray-900 text-white">
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
          isModifying={
            !!runeEditingId ||
            !!newRuneFormLocation ||
            !!chainEditingId ||
            showNewChainForm
          }
          onAddNew={() => handleAddNewRune("start")}
        />
      )}

      <div className="relative">
        {(isRunesRefetching || isChainsRefetching) && (
          <div className="absolute inset-0 bg-gray-900/75 z-10 flex justify-center overflow-hidden rounded-lg transform">
            <div className="fixed top-1/2">
              <Loader2 className="h-12 w-12 text-cyan-300 animate-spin -translate-y-1/2" />
            </div>
          </div>
        )}

        <button
          onClick={() => setShowChainsSection(!showChainsSection)}
          className="w-full flex justify-center items-center gap-2 mb-4 cursor-pointer"
        >
          <h2 className="text-2xl font-bold text-gray-300">Chains</h2>
          {showChainsSection ? <ChevronUp /> : <ChevronDown />}
        </button>
        {
          <>
            <div className="mb-4">
              {showChainsSection &&
                (isChainsLoading ? (
                  <p className="text-center mb-4">Loading chains...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chains.map((chain) => (
                      <ChainCard
                        key={chain.id}
                        chain={chain}
                        isEditing={chainEditingId === chain.id}
                        onSave={handleSaveChain}
                        onCancel={handleCancelForms}
                        onEdit={setChainEditingId}
                        onDelete={handleDeleteChain}
                        onCopyRuneToNew={handleCopyChainRuneToNew}
                        runeToAdd={chainRuneToAdd}
                        onRuneAdded={() => setChainRuneToAdd(null)}
                      />
                    ))}
                    {showNewChainForm ? (
                      <ChainCard
                        key="newChainForm"
                        isEditing
                        onSave={handleSaveChain}
                        onCancel={handleCancelForms}
                        onCopyRuneToNew={handleCopyChainRuneToNew}
                        runeToAdd={chainRuneToAdd}
                        onRuneAdded={() => setChainRuneToAdd(null)}
                      />
                    ) : (
                      !chainEditingId && (
                        <button
                          onClick={() => setShowNewChainForm(true)}
                          className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400 cursor-pointer"
                        >
                          <span className="text-6xl font-thin">+</span>
                        </button>
                      )
                    )}
                  </div>
                ))}
            </div>
          </>
        }

        <h2
          ref={runeTitleRef}
          className="text-2xl text-center font-bold text-gray-300 mb-4"
        >
          Runes
        </h2>
        {isRunesLoading ? (
          <p className="text-center mb-4">Loading runes...</p>
        ) : isAnyFilterActive && !processedRunes.length ? (
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
      <div className="mt-auto w-full flex justify-center pt-4">
        <button
          className="text-xs text-gray-300 underline cursor-pointer hover:no-underline"
          onClick={() => signOut()}
        >
          Log out
        </button>
      </div>
    </main>
  )
}

export default withAuthGating(Notes)
