import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Chain, RuneLines } from "@/types"
import RuneEditor from "@/components/runes/RuneEditor"
import { Check, FilePlus, Pencil, Trash2, X } from "lucide-react"
import {
  EMPTY_CHAIN_DATA,
  EMPTY_RUNE_LINES,
  GRID_COLS_OPTION,
} from "@/utils/consts"
import { useConfig } from "@/context/ConfigContext"
import useTapOrHover from "@/hooks/useTapOrHover"
import { useDeleteChain, useSaveChain } from "@/hooks/data/chains"
import { useRunes } from "@/hooks/data/runes"
import { GRID_COLS_CLASSES } from "@/styles"
import { isExactLineMatch } from "@/utils/runes"

interface ChainCardProps {
  chain?: Partial<Chain>
  isEditing: boolean
  onEdit?: (id: string) => void
  isOtherFormActive?: boolean
  onCancel: () => void
  onCopyRune?: (lines: RuneLines) => void
  consumeRune?: () => RuneLines | null
  onScrollToRune?: (id: string) => void
}

const SMALL_GRID_COLS = ["1", "2", "3"] as GRID_COLS_OPTION[]
const FALLBACK_GRID_COLS = "4" as GRID_COLS_OPTION

function ChainCard({
  chain,
  isEditing,
  onEdit,
  isOtherFormActive,
  onCancel,
  onCopyRune,
  consumeRune,
  onScrollToRune,
}: ChainCardProps) {
  const {
    elementRef,
    handlers,
    buttonClasses: hiddenButtonClasses,
  } = useTapOrHover({ isDisabled: isEditing })

  const { gridCols, isVerticalCards } = useConfig()

  const { data: runes = [] } = useRunes()
  const saveChainMutation = useSaveChain()
  const deleteChainMutation = useDeleteChain()

  const [formData, setFormData] = useState(EMPTY_CHAIN_DATA)
  useEffect(() => {
    if (chain) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, sequence, ...editableData } = chain
      setFormData({ ...EMPTY_CHAIN_DATA, ...editableData })
    } else {
      setFormData(EMPTY_CHAIN_DATA)
    }
  }, [chain])

  const runesWithTranslations = useMemo(
    () =>
      formData.runes.map((rune) => {
        const runeRecord = runes.find((runeRecord) =>
          isExactLineMatch(rune, runeRecord.lines)
        )
        return runeRecord ?? { id: "", lines: rune, translation: "" }
      }),
    [formData.runes, runes]
  )

  const effectiveGridCols = useMemo(
    () => (SMALL_GRID_COLS.includes(gridCols) ? FALLBACK_GRID_COLS : gridCols),
    [gridCols]
  )

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

  const handleSave = useCallback(async () => {
    const body = chain?.id ? { ...formData, id: chain.id } : formData
    saveChainMutation.mutate(body)
    onCancel()
  }, [chain, formData, onCancel, saveChainMutation])

  const handleDelete = async () => {
    if (!chain?.id) {
      return
    }
    deleteChainMutation.mutate(chain.id)
  }

  useEffect(() => {
    if (!isEditing) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
      }

      // enter to save, enter + mod to add newline in textarea
      if (event.key === "Enter") {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
          return
        }

        event.preventDefault()
        handleSave()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isEditing, handleSave, onCancel])

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
          "grid p-4 pt-6 rounded-md " +
          (GRID_COLS_CLASSES[effectiveGridCols] || "grid-cols-8")
        }
      >
        {runesWithTranslations.map((rune, index, arr) => (
          <div key={index} className="relative grid grid-cols-1">
            <RuneEditor
              isEditing={isEditing}
              runeState={rune.lines}
              setRuneState={(newLines) => handleRuneChange(index, newLines)}
              chainPosition={
                index === 0
                  ? "first"
                  : index === arr.length - 1
                  ? "last"
                  : "middle"
              }
            />
            {!isEditing &&
              !isOtherFormActive &&
              (rune.id && onScrollToRune ? (
                <button
                  onClick={() => onScrollToRune(rune.id)}
                  title="Edit Rune"
                  className="absolute top-0 -translate-y-full left-[53%] -translate-x-1/2 p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer"
                >
                  <Pencil size={20} />
                </button>
              ) : (
                onCopyRune && (
                  <button
                    onClick={() => onCopyRune(rune.lines)}
                    title="Copy to New Rune"
                    className="absolute top-0 -translate-y-full left-[53%] -translate-x-1/2 p-1 bg-gray-600 text-white rounded cursor-pointer"
                  >
                    <FilePlus size={20} />
                  </button>
                )
              ))}
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
                className="absolute top-0 -translate-y-full left-[53%] -translate-x-1/2 p-1 bg-red-600 text-white rounded cursor-pointer"
              >
                <X size={20} />
              </button>
            )}
            <h2 className="col-span-2 text-lg font-bold text-white text-center h-8 flex items-center justify-center break-all truncate">
              {rune.translation}
            </h2>
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

      <div className="pr-12 h-12">
        {isEditing ? (
          <textarea
            name="note"
            value={formData.note}
            onChange={handleFieldChange}
            placeholder="Note..."
            className="text-sm bg-gray-900 rounded p-1 h-full w-full resize-none"
          />
        ) : (
          chain?.note && (
            <p className="text-sm text-gray-400 whitespace-pre-wrap h-full p-1 break-all truncate">
              {chain.note}
            </p>
          )
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col h-full justify-end gap-2 absolute bottom-4 right-4">
          <button
            onClick={onCancel}
            className="p-2 bg-red-600 rounded cursor-pointer"
          >
            <X size={20} />
          </button>
          <button
            onClick={handleSave}
            className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded cursor-pointer"
          >
            <Check size={20} />
          </button>
        </div>
      )}

      {!isEditing && !isOtherFormActive && chain?.id && (
        <div
          className={
            "absolute flex gap-2 right-4 " +
            hiddenButtonClasses +
            (isVerticalCards ? " flex-col-reverse bottom-4" : " top-4")
          }
        >
          <button
            onClick={handleEdit}
            className={
              "p-2 bg-cyan-600 hover:bg-cyan-500 rounded cursor-pointer"
            }
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={handleDelete}
            className={"p-2 bg-red-600 hover:bg-red-500 rounded cursor-pointer"}
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(ChainCard)
