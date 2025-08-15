import { memo, useEffect, useMemo, useState } from "react"
import { Chain, RuneLines } from "@/types"
import RuneEditor from "@/components/runes/RuneEditor"
import { Check, FilePlus, Pencil, Trash2, X } from "lucide-react"
import {
  EMPTY_CHAIN_DATA,
  EMPTY_RUNE_LINES,
  GRID_COLS_CLASSES,
  GRID_COLS_OPTION,
} from "@/lib/consts"
import { useConfig } from "@/context/ConfigContext"
import useTapOrHover from "@/hooks/useTapOrHover"
import { useDeleteChain, useSaveChain } from "@/hooks/data/chains"

interface ChainCardProps {
  chain?: Partial<Chain>
  isEditing: boolean
  onEdit?: (id: string) => void
  onCancel: () => void
  onCopyRune?: (lines: RuneLines) => void
  consumeRune?: () => RuneLines | null
}

const SMALL_GRID_COLS = ["1", "2", "3"] as GRID_COLS_OPTION[]
const FALLBACK_GRID_COLS = "4" as GRID_COLS_OPTION

function ChainCard({
  chain,
  isEditing,
  onEdit,
  onCancel,
  onCopyRune,
  consumeRune,
}: ChainCardProps) {
  const { gridCols, isVerticalCards } = useConfig()

  const [formData, setFormData] = useState(EMPTY_CHAIN_DATA)

  const saveChainMutation = useSaveChain()
  const deleteChainMutation = useDeleteChain()

  const effectiveGridCols = useMemo(
    () => (SMALL_GRID_COLS.includes(gridCols) ? FALLBACK_GRID_COLS : gridCols),
    [gridCols]
  )

  useEffect(() => {
    if (chain) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, sequence, ...editableData } = chain
      setFormData({ ...EMPTY_CHAIN_DATA, ...editableData })
    } else {
      setFormData(EMPTY_CHAIN_DATA)
    }
  }, [chain])

  useEffect(() => {
    const rune = consumeRune?.()
    if (isEditing && rune) {
      setFormData((prev) => {
        const prevRunes = prev.runes
        const lastPrevRuneIndex = prevRunes.length - 1
        return {
          ...prev,
          runes: [
            ...(prevRunes[lastPrevRuneIndex].some((v) => v)
              ? prevRunes
              : prevRunes.slice(0, lastPrevRuneIndex)),
            rune,
          ],
        }
      })
    }
  }, [isEditing, consumeRune])

  const handleEdit = () => {
    if (!chain?.id || !onEdit) {
      return
    }
    onEdit(chain.id)
  }

  const handleRuneChange = (runeIndex: number, newLines: RuneLines) => {
    const updatedRunes = [...formData.runes]
    updatedRunes[runeIndex] = newLines
    setFormData((prev) => ({ ...prev, runes: updatedRunes }))
  }

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    const body = chain?.id ? { ...formData, id: chain.id } : formData
    saveChainMutation.mutate(body)
    onCancel()
  }

  const handleDelete = async () => {
    if (!chain?.id) {
      return
    }
    deleteChainMutation.mutate(chain.id)
  }

  const {
    elementRef,
    handlers,
    buttonClasses: hiddenButtonClasses,
  } = useTapOrHover({ isDisabled: isEditing })

  return (
    <div
      ref={elementRef}
      {...handlers}
      className={`relative group bg-gray-800 p-4 rounded-lg border-2 ${
        isEditing ? "border-cyan-500" : "border-gray-700"
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          name="translation"
          value={formData.translation}
          onChange={handleFieldChange}
          placeholder="Translation"
          className="text-xl font-bold bg-gray-900 rounded p-2 w-full mb-4 h-10"
          autoFocus
        />
      ) : (
        <h3 className="text-xl font-bold text-white mb-4 pl-2 h-10 leading-10 break-all truncate">
          {chain?.translation || (
            <span className="text-gray-500">No translation</span>
          )}
        </h3>
      )}

      <div
        className={
          "grid p-4 rounded-md " +
          (GRID_COLS_CLASSES[effectiveGridCols] || "grid-cols-8")
        }
      >
        {formData.runes.map((runeLines, index, arr) => (
          <div key={index} className="relative grid grid-cols-1 pb-8">
            <RuneEditor
              isEditing={isEditing}
              runeState={runeLines}
              setRuneState={(newLines) => handleRuneChange(index, newLines)}
              chainPosition={
                index === 0
                  ? "first"
                  : index === arr.length - 1
                  ? "last"
                  : "middle"
              }
            />
            {!isEditing && onCopyRune && (
              <button
                onClick={() => onCopyRune(runeLines)}
                title="Copy to New Rune"
                className="absolute bottom-0 left-[52%] -translate-x-1/2 p-1 bg-gray-600 text-white rounded cursor-pointer"
              >
                <FilePlus size={20} />
              </button>
            )}
            {isEditing && arr.length > 1 && (
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    runes: [
                      ...prev.runes?.slice(0, index),
                      ...prev.runes?.slice(index + 1),
                    ],
                  }))
                }
                title="Delete from Chain"
                className="absolute bottom-0 left-[52%] -translate-x-1/2 p-1 bg-red-600 text-white rounded cursor-pointer"
              >
                <X size={20} />
              </button>
            )}
          </div>
        ))}
        {isEditing && (
          <button
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                runes: [...prev.runes, EMPTY_RUNE_LINES],
              }))
            }
            className="flex items-center justify-center min-h-8 m-2 mb-10 border-4 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg transition-colors text-gray-500 hover:text-cyan-400 cursor-pointer"
          >
            <span className="text-6xl font-thin">+</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 h-20">
        {isEditing ? (
          <textarea
            name="note"
            value={formData.note}
            onChange={handleFieldChange}
            placeholder="Note..."
            className="text-sm bg-gray-900 rounded p-2 h-full w-full resize-none"
          />
        ) : (
          chain?.note && (
            <p className="text-sm text-gray-400 whitespace-pre-wrap pl-2 pt-2 break-all truncate">
              {chain.note}
            </p>
          )
        )}

        {isEditing && (
          <div className="flex flex-col h-full justify-end gap-2">
            <button
              onClick={onCancel}
              className="p-2 bg-red-600 rounded cursor-pointer"
            >
              <X size={20} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 bg-cyan-600 rounded cursor-pointer"
            >
              <Check size={20} />
            </button>
          </div>
        )}
      </div>

      {!isEditing && chain?.id && (
        <div
          className={
            "absolute flex gap-2 right-4 " +
            hiddenButtonClasses +
            (isVerticalCards ? " flex-col-reverse bottom-4" : " top-4")
          }
        >
          <button
            onClick={handleEdit}
            className={"p-2 bg-cyan-600 rounded cursor-pointer"}
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={handleDelete}
            className={"p-2 bg-red-600 rounded cursor-pointer"}
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(ChainCard)
