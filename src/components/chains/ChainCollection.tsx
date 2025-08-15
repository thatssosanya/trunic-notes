import { useEffect } from "react"
import ChainCard from "@/components/chains/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useChains } from "@/hooks/data/chains"
import usePersistedState from "@/hooks/usePersistedState"
import { useAppState } from "@/context/AppStateContext"
import { EditStates } from "@/lib/enums"
import { RuneLines } from "@/types"

type ChainCollectionProps = {
  onCopyRune: (lines: RuneLines) => void
  consumeRuneForChain: () => RuneLines | null
}

export default function ChainCollection({
  onCopyRune,
  consumeRuneForChain,
}: ChainCollectionProps) {
  const { editingId, editState, cancelEdit, addChain, editChain } =
    useAppState()
  const [showChainsSection, setShowChainsSection] = usePersistedState(
    "trunic-show-chains-section",
    false
  )
  useEffect(() => {
    if (
      !showChainsSection &&
      (editState === EditStates.ADDING_CHAIN ||
        editState === EditStates.EDITING_CHAIN)
    ) {
      cancelEdit()
    }
  }, [showChainsSection, editState, cancelEdit])

  const { data: chains = [], isLoading } = useChains()

  const isEditing = editState === EditStates.EDITING_CHAIN

  return (
    <div className="relative">
      {/* {isRefetching && (
        <div className="absolute inset-0 bg-gray-900/75 z-10 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-cyan-300 animate-spin" />
        </div>
      )} */}
      <button
        onClick={() => setShowChainsSection(!showChainsSection)}
        className="w-full flex justify-center items-center gap-2 mb-4 cursor-pointer"
      >
        <h2 className="text-2xl font-bold text-gray-300">Chains</h2>
        {showChainsSection ? <ChevronUp /> : <ChevronDown />}
      </button>

      {showChainsSection && (
        <div className="mb-4">
          {isLoading ? (
            <p className="text-center mb-4">Loading chains...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chains.map((chain) => {
                const isEditingThis = isEditing && editingId === chain.id
                return (
                  <ChainCard
                    key={chain.id}
                    chain={chain}
                    isEditing={isEditingThis}
                    onEdit={editChain}
                    onCancel={cancelEdit}
                    onCopyRune={
                      editState === EditStates.IDLE ? onCopyRune : undefined
                    }
                    consumeRune={
                      isEditingThis ? consumeRuneForChain : undefined
                    }
                  />
                )
              })}
              {editState === EditStates.ADDING_CHAIN ? (
                <ChainCard
                  key="newChainForm"
                  isEditing
                  onCancel={cancelEdit}
                  consumeRune={consumeRuneForChain}
                />
              ) : (
                editState === EditStates.IDLE && (
                  <button
                    onClick={addChain}
                    className="flex items-center justify-center w-full h-full min-h-24 border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400 cursor-pointer"
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
