import { useEffect, useMemo } from "react"
import ChainCard from "@/components/chains/card"
import { ChevronDown } from "lucide-react"
import { useChains } from "@/hooks/data/chains"
import usePersistedState from "@/hooks/usePersistedState"
import { useAppState } from "@/context/AppStateContext"
import { EditState } from "@/utils/enums"
import { RuneLines } from "@/types"
import { useSearchState } from "@/context/SearchStateContext"
import { useRunes } from "@/hooks/data/runes"
import { isExactLineMatch } from "@/utils/runes"
import { cn } from "@/styles"

type ChainCollectionProps = {
  onCopyRune: (lines: RuneLines) => void
  consumeRuneForChain: () => RuneLines | null
  onScrollToRune: (id: string) => void
}

export default function ChainCollection({
  onCopyRune,
  consumeRuneForChain,
  onScrollToRune,
}: ChainCollectionProps) {
  const {
    isTextSearchActive,
    searchQuery,
    isRuneSearchActive,
    activeSearchRuneIndices,
  } = useSearchState()
  const { editingId, editState, cancelEdit, addChain, editChain } =
    useAppState()

  const { data: chains = [], isLoading, isError } = useChains()
  const { data: runes = [] } = useRunes()

  const [showChainsSection, setShowChainsSection] = usePersistedState(
    "trunic-show-chains-section",
    false
  )
  useEffect(() => {
    if (
      !showChainsSection &&
      (editState === EditState.ADDING_CHAIN ||
        editState === EditState.EDITING_CHAIN)
    ) {
      cancelEdit()
    }
  }, [showChainsSection, editState, cancelEdit])

  const isEditing = editState === EditState.EDITING_CHAIN

  const filteredChains = useMemo(() => {
    const baseFiltered = chains.filter((chain) => {
      const textMatch =
        !isTextSearchActive ||
        chain.translation.toLowerCase().includes(searchQuery) ||
        chain.note.toLowerCase().includes(searchQuery) ||
        chain.runes
          .map((lines) =>
            runes.find((rune) => isExactLineMatch(rune.lines, lines))
          )
          .filter((v) => v)
          .some((rune) => rune?.translation.toLowerCase().includes(searchQuery))

      const visualMatch =
        !isRuneSearchActive ||
        chain.runes.some((rune) =>
          activeSearchRuneIndices.every((searchIndex) => rune[searchIndex])
        )
      return textMatch && visualMatch
    })
    return baseFiltered
  }, [
    chains,
    runes,
    isTextSearchActive,
    searchQuery,
    isRuneSearchActive,
    activeSearchRuneIndices,
  ])

  const isAnySearchActive = isTextSearchActive || isRuneSearchActive

  return (
    <div className="relative">
      <button
        onClick={() => setShowChainsSection(!showChainsSection)}
        className="w-full flex justify-center items-center gap-2 mb-4 cursor-pointer text-secondary"
      >
        <h2 className="text-2xl font-bold">Chains</h2>
        <ChevronDown
          className={cn(
            "transition-transform rotate-0",
            showChainsSection && "rotate-180"
          )}
        />
      </button>

      {showChainsSection && (
        <div className="mb-4">
          {isError ? (
            <p className="text-center mb-4 text-danger">
              Couldn&apos;t load chains: An error occurred
            </p>
          ) : isLoading ? (
            <p className="text-center mb-4">Loading chains...</p>
          ) : isAnySearchActive &&
            !filteredChains.length &&
            editState !== EditState.ADDING_CHAIN ? (
            <div className="w-full text-center text-lg pt-4">
              Nothing matched your search
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredChains.map((chain) => {
                const isEditingThis = isEditing && editingId === chain.id
                return (
                  <ChainCard
                    key={chain.id}
                    chain={chain}
                    isEditing={isEditingThis}
                    onEdit={editChain}
                    isOtherFormActive={
                      editState !== EditState.IDLE && !isEditingThis
                    }
                    onCancel={cancelEdit}
                    onCopyRune={
                      editState === EditState.IDLE ? onCopyRune : undefined
                    }
                    consumeRune={
                      isEditingThis ? consumeRuneForChain : undefined
                    }
                    onScrollToRune={onScrollToRune}
                  />
                )
              })}
              {editState === EditState.ADDING_CHAIN ? (
                <ChainCard
                  key="newChainForm"
                  isEditing
                  onCancel={cancelEdit}
                  consumeRune={consumeRuneForChain}
                />
              ) : (
                editState === EditState.IDLE &&
                !isAnySearchActive && (
                  <button
                    onClick={addChain}
                    className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-primary hover:border-accent rounded-lg transition-colors text-muted hover:text-accent cursor-pointer"
                  >
                    <span className="text-6xl font-thin">+</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
