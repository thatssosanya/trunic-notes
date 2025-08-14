import { useEffect, useState } from "react"
import { Chain, ChainData, RuneLines } from "@/types"
import RuneEditor from "@/components/RuneEditor"
import { Check, FilePlus, Pencil, Trash2, X } from "lucide-react"
import { EMPTY_RUNE_LINES, GRID_COLS_CLASSES } from "@/lib/consts"
import { useConfig } from "@/context/ConfigContext"
import useTapOrHover from "@/hooks/useTapOrHover"

interface ChainCardProps {
  chain?: Chain
  isEditing: boolean
  onSave: (data: ChainData) => void
  onCancel: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onCopyRuneToNew: (lines: RuneLines) => void
  runeToAdd?: RuneLines | null
  onRuneAdded?: () => void
}

const emptyChainData: ChainData = {
  runes: [EMPTY_RUNE_LINES],
  translation: "",
  note: "",
}

export default function ChainCard({
  chain,
  isEditing,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onCopyRuneToNew,
  runeToAdd,
  onRuneAdded,
}: ChainCardProps) {
  const [formData, setFormData] = useState(emptyChainData)
  const { gridCols } = useConfig()
  const effectiveGridCols = ["1", "2", "3"].includes(gridCols) ? "4" : gridCols

  useEffect(() => {
    setFormData({
      runes: chain?.runes || [EMPTY_RUNE_LINES],
      translation: chain?.translation || "",
      note: chain?.note || "",
    })
  }, [chain, isEditing])

  useEffect(() => {
    if (runeToAdd) {
      setFormData((prev) => {
        const prevRunes = prev.runes
        const lastPrevRuneIndex = prevRunes.length - 1
        return {
          ...prev,
          runes: [
            ...(prevRunes[lastPrevRuneIndex].some((v) => v)
              ? prevRunes
              : prevRunes.slice(0, lastPrevRuneIndex)),
            runeToAdd,
          ],
        }
      })
      onRuneAdded?.()
    }
  }, [runeToAdd, onRuneAdded])

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

  const handleSave = () => onSave(formData)
  const handleEdit = () => onEdit && chain && onEdit(chain.id)
  const handleDelete = () => onDelete && chain && onDelete(chain.id)

  const {
    elementRef,
    handlers,
    buttonClasses: hiddenButtonClasses,
  } = useTapOrHover({ isEditing })

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
          className="text-xl font-bold bg-gray-900 rounded p-2 w-full mb-4"
        />
      ) : (
        <h3 className="text-xl font-bold text-white mb-4">
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
            {!isEditing && (
              <button
                onClick={() => onCopyRuneToNew(runeLines)}
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

      {isEditing ? (
        <textarea
          name="note"
          value={formData.note}
          onChange={handleFieldChange}
          placeholder="Note..."
          className="text-sm bg-gray-900 rounded p-2 w-full"
        />
      ) : (
        chain?.note && (
          <p className="text-sm text-gray-400 whitespace-pre-wrap">
            {chain.note}
          </p>
        )
      )}

      {isEditing && (
        <div className="flex justify-end gap-2 mt-4">
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

      {!isEditing && chain?.id && (
        <div
          className={"absolute top-2 right-2 flex gap-2" + hiddenButtonClasses}
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
