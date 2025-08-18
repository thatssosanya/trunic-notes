import { memo, useCallback, useEffect, useState } from "react"
import { Rune, RuneData, RuneLines } from "@/types"
import RuneEditor from "@/components/runes/RuneEditor"
import { useConfig } from "@/context/ConfigContext"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { EMPTY_RUNE_DATA, EMPTY_RUNE_LINES } from "@/utils/consts"
import useTapOrHover from "@/hooks/useTapOrHover"
import { useDeleteRune, useSaveRune } from "@/hooks/data/runes"

interface RuneCardProps {
  rune?: Partial<Rune>
  isEditing: boolean
  onEdit?: (id: string) => void
  onCancel: () => void
  isOtherFormActive?: boolean
  onAddRuneForChain?: (lines: RuneLines) => void
  shouldScroll?: boolean
  onScrollComplete?: () => void
}

const buttonBaseClass =
  "h-8 w-8 flex items-center justify-center rounded cursor-pointer"
const cyanButtonClass = `${buttonBaseClass} bg-cyan-600 hover:bg-cyan-500`
const redButtonClass = `${buttonBaseClass} bg-red-600 hover:bg-red-500`

function RuneCard({
  rune,
  isEditing,
  onEdit,
  onCancel,
  isOtherFormActive,
  onAddRuneForChain,
  shouldScroll,
  onScrollComplete,
}: RuneCardProps) {
  const {
    elementRef,
    handlers,
    buttonClasses: hiddenButtonClasses,
  } = useTapOrHover({ isDisabled: isEditing })

  const { isVerticalCards } = useConfig()

  const [formData, setFormData] = useState<RuneData>({
    ...EMPTY_RUNE_DATA,
    ...rune,
  })

  const saveRuneMutation = useSaveRune()
  const deleteRuneMutation = useDeleteRune()

  useEffect(() => {
    if (rune) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setFormData({ ...EMPTY_RUNE_DATA, ...rune })
    } else {
      setFormData(EMPTY_RUNE_DATA)
    }
  }, [rune])

  const handleEdit = () => {
    if (!rune?.id || !onEdit) {
      return
    }
    onEdit(rune.id)
  }

  const handleRuneChange = (lines: RuneLines) => {
    setFormData((prev) => ({ ...prev, lines }))
  }

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    if (name === "isNotConfident") {
      setFormData((prev) => ({
        ...prev,
        isConfident: !isCheckbox
          ? prev.isConfident
          : !(e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      }))
    }
  }

  const handleSave = useCallback(async () => {
    const body = rune?.id ? { ...formData, id: rune.id } : formData
    saveRuneMutation.mutate(body)
    onCancel()
  }, [rune, formData, onCancel, saveRuneMutation])

  const handleDelete = () => {
    if (!rune?.id) {
      return
    }
    deleteRuneMutation.mutate(rune.id)
  }

  useEffect(() => {
    if (!shouldScroll || !elementRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 1) {
          if (rune?.id) {
            onEdit?.(rune.id)
          }

          onScrollComplete?.()

          observer.disconnect()
        }
      },
      {
        threshold: 1.0,
      }
    )

    observer.observe(elementRef.current)

    elementRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })

    return () => {
      observer.disconnect()
    }
  }, [rune?.id, onEdit, shouldScroll, onScrollComplete, elementRef])

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

  // ===================================================================
  // VERTICAL CARD RENDER
  // ===================================================================
  if (isVerticalCards) {
    return (
      <div
        ref={elementRef}
        {...handlers}
        className={`bg-gray-800 p-3 rounded-lg border-2 h-full relative group flex flex-col items-center gap-2 ${
          isEditing ? "border-cyan-500" : "border-gray-700"
        }`}
      >
        <div className="w-full mb-1">
          <RuneEditor
            isEditing={isEditing}
            runeState={
              isEditing ? formData.lines : rune?.lines || EMPTY_RUNE_LINES
            }
            setRuneState={handleRuneChange}
          />
        </div>

        <div className="w-full grid grid-cols-[1fr_auto] gap-2">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2 w-full h-8">
                <input
                  type="text"
                  name="translation"
                  placeholder="Translation"
                  value={formData.translation}
                  onChange={handleFieldChange}
                  className="bg-gray-900 text-white p-1 rounded w-full h-full text-center text-lg font-bold"
                  autoFocus
                />
                <label
                  htmlFor={`isNotConfident-${rune?.id || "new"}`}
                  className="flex items-center gap-1 cursor-pointer text-amber-400"
                  title="Mark as uncertain"
                >
                  <input
                    type="checkbox"
                    id={`isNotConfident-${rune?.id || "new"}`}
                    name="isNotConfident"
                    checked={!formData.isConfident}
                    onChange={handleFieldChange}
                    className="w-5 h-5 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xl font-bold">?</span>
                </label>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onCancel}
                title="Cancel"
                className={redButtonClass}
              >
                <X size={20} />
              </button>

              <input
                name="note"
                placeholder="Note..."
                value={formData.note}
                onChange={handleFieldChange}
                className="bg-gray-900 text-white p-1 rounded w-full text-sm h-8"
              />
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleSave}
                title="Save"
                className={cyanButtonClass}
              >
                <Check size={20} />
              </button>
            </>
          ) : (
            <>
              <h2 className="col-span-2 text-lg font-bold text-white text-center h-8 flex items-center justify-center break-all truncate">
                {rune?.translation || (
                  <span className="text-gray-500">No translation</span>
                )}
                {!rune?.isConfident && (
                  <span className="text-amber-400 ml-2">?</span>
                )}
              </h2>

              {rune?.note && (
                <div className="col-span-2 text-gray-400 text-sm w-full text-center h-8 flex items-center justify-center break-all truncate">
                  {rune.note}
                </div>
              )}

              {onAddRuneForChain && rune?.lines ? (
                <button
                  onClick={() => rune.lines && onAddRuneForChain(rune.lines)}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Add this rune to the chain being edited"
                  className="absolute top-2 left-2 p-1 bg-green-600 hover:bg-green-500 text-white rounded cursor-pointer"
                >
                  <Plus size={20} />
                </button>
              ) : (
                !isOtherFormActive && (
                  <div
                    className={
                      "absolute bottom-3 right-3 flex flex-col gap-2" +
                      hiddenButtonClasses
                    }
                  >
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={handleDelete}
                      title="Delete"
                      className={redButtonClass}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={handleEdit}
                      title="Edit"
                      className={cyanButtonClass}
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ===================================================================
  // HORIZONTAL CARD RENDER
  // ===================================================================
  return (
    <div
      ref={elementRef}
      {...handlers}
      className={`bg-gray-800 p-4 rounded-lg border-2 h-full relative group grid grid-cols-2 gap-4 ${
        isEditing ? "border-cyan-500" : "border-gray-700"
      }`}
    >
      <div>
        <RuneEditor
          isEditing={isEditing}
          runeState={
            isEditing ? formData.lines : rune?.lines || EMPTY_RUNE_LINES
          }
          setRuneState={handleRuneChange}
        />
      </div>
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
          <h2 className="text-xl font-bold text-white truncate h-[3rem] flex items-center">
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
              Confident Translation
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
          rune?.note && (
            <p className="text-gray-400 mt-1 flex-grow overflow-auto text-sm whitespace-pre-wrap">
              {rune.note}
            </p>
          )
        )}
        {isEditing && (
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onCancel}
              title="Cancel"
              className={redButtonClass}
            >
              <X size={20} />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleSave}
              title="Save"
              className={cyanButtonClass}
            >
              <Check size={20} />
            </button>
          </div>
        )}
      </div>
      {!isEditing && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleEdit}
            title="Edit"
            className={cyanButtonClass}
          >
            <Pencil size={20} />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDelete}
            title="Delete"
            className={redButtonClass}
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(RuneCard)
