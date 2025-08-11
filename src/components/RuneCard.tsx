import { useEffect, useState } from "react"
import { Rune } from "../types"
import RuneEditor from "./RuneEditor"

type RuneData = Omit<Rune, "id" | "sequence">

interface RuneCardProps {
  rune?: Rune
  isEditing?: boolean
  isNew?: boolean
  onSave: (data: RuneData) => void
  onCancel: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const emptyRuneData: RuneData = {
  lines: new Array(13).fill(false),
  translation: "",
  isConfident: true,
  note: "",
}

export default function RuneCard({
  rune,
  isEditing = false,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}: RuneCardProps) {
  const [formData, setFormData] = useState<RuneData>(emptyRuneData)

  useEffect(() => {
    setFormData(rune || emptyRuneData)
  }, [rune, isEditing])

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleRuneChange = (lines: boolean[]) => {
    setFormData((prev) => ({ ...prev, lines }))
  }

  const handleSave = () => onSave(formData)
  const handleEdit = () => onEdit && rune && onEdit(rune.id)
  const handleDelete = () => {
    if (
      onDelete &&
      rune &&
      window.confirm("Are you sure you want to delete this rune?")
    ) {
      onDelete(rune.id)
    }
  }

  return (
    <div
      className={`
        bg-gray-800 p-2 rounded-lg border-2 h-full relative group
        grid grid-cols-2 gap-2
        ${isEditing ? "border-cyan-500" : "border-gray-700"}
      `}
    >
      {/* --- COLUMN 1: RUNE EDITOR --- */}
      <div>
        <RuneEditor
          runeState={isEditing ? formData.lines : rune?.lines || []}
          setRuneState={isEditing ? handleRuneChange : () => {}}
        />
      </div>

      {/* --- COLUMN 2: TEXT & FORM --- */}
      <div className="flex flex-col gap-3">
        {isEditing ? (
          <input
            type="text"
            name="translation"
            placeholder="Translation"
            value={formData.translation}
            onChange={handleFieldChange}
            className="bg-gray-900 text-white p-2 rounded w-full text-xl font-bold"
            autoFocus
          />
        ) : (
          <h2 className="text-2xl font-bold text-white truncate">
            {rune?.translation || (
              <span className="text-gray-500">No Translation</span>
            )}
            {!rune?.isConfident && (
              <span className="text-amber-400 ml-2">?</span>
            )}
          </h2>
        )}

        {isEditing && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`isConfident-${rune?.id || "new"}`}
              name="isConfident"
              checked={formData.isConfident}
              onChange={handleFieldChange}
              className="w-4 h-4 accent-cyan-500"
            />
            <label
              htmlFor={`isConfident-${rune?.id || "new"}`}
              className="text-gray-300"
            >
              Confident
            </label>
          </div>
        )}

        {isEditing ? (
          <textarea
            name="note"
            placeholder="Notes..."
            value={formData.note}
            onChange={handleFieldChange}
            className="bg-gray-900 text-white p-2 rounded w-full flex-grow text-sm"
          />
        ) : (
          <p className="text-gray-400 mt-1 flex-grow overflow-auto text-sm whitespace-pre-wrap">
            {rune?.note || <span className="text-gray-500">No note.</span>}
          </p>
        )}

        {isEditing && (
          <div className="grid grid-cols-2 gap-2 justify-end mt-auto">
            <button
              onClick={onCancel}
              title="Cancel"
              className="text-xl bg-gray-600 hover:bg-gray-500 rounded"
            >
              ❌
            </button>
            <button
              onClick={handleSave}
              title="Save"
              className="text-xl bg-cyan-600 hover:bg-cyan-500 rounded"
            >
              ✅
            </button>
          </div>
        )}
      </div>

      {/* --- HOVER BUTTONS (VIEW MODE ONLY) --- */}
      {!isEditing && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            title="Edit"
            className="p-2 text-sm bg-blue-600 hover:bg-blue-500 rounded"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            className="p-2 text-sm bg-red-600 hover:bg-red-500 rounded"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  )
}
