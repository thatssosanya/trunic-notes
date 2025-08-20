import { memo, useCallback, useEffect, useState } from "react"
import { Rune, RuneLines } from "@/types"
import RuneEditor from "@/components/runes/RuneEditor"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { EMPTY_RUNE_DATA, EMPTY_RUNE_LINES } from "@/utils/consts"
import useTapOrHover from "@/hooks/useTapOrHover"
import { useDeleteRune, useSaveRune } from "@/hooks/data/runes"
import IconButton from "@/components/common/IconButton"
import { ButtonColor, cn } from "@/styles"

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

  const [formData, setFormData] = useState({
    ...EMPTY_RUNE_DATA,
    ...rune,
  })
  useEffect(() => {
    setFormData({ ...EMPTY_RUNE_DATA, ...rune })
  }, [rune])

  const saveRuneMutation = useSaveRune()
  const deleteRuneMutation = useDeleteRune()

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

  return (
    <div
      ref={elementRef}
      {...handlers}
      className={cn(
        "bg-card p-3 rounded-lg border-2 h-full relative group flex flex-col items-center gap-2",
        isEditing ? "border-accent" : "border-primary"
      )}
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
                className="bg-input p-1 rounded w-full h-full text-center text-lg font-bold"
                autoFocus
              />
              <label
                htmlFor={`isNotConfident-${rune?.id || "new"}`}
                className="flex items-center gap-1 cursor-pointer text-accent-secondary"
                title="Mark as uncertain"
              >
                <input
                  type="checkbox"
                  id={`isNotConfident-${rune?.id || "new"}`}
                  name="isNotConfident"
                  checked={!formData.isConfident}
                  onChange={handleFieldChange}
                  className="w-5 h-5 accent-accent-secondary cursor-pointer"
                />
                <span className="text-xl font-bold">?</span>
              </label>
            </div>
            <IconButton
              Icon={X}
              color={ButtonColor.RED}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onCancel}
              title="Cancel"
            />

            <input
              name="note"
              placeholder="Note..."
              value={formData.note}
              onChange={handleFieldChange}
              className="bg-input p-1 rounded w-full text-sm h-8"
            />
            <IconButton
              Icon={Check}
              color={ButtonColor.CYAN}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleSave}
              title="Save"
            />
          </>
        ) : (
          <>
            <h2 className="col-span-2 text-lg font-bold text-center h-8 flex items-center justify-center break-all truncate">
              {rune?.translation || (
                <span className="text-muted">No translation</span>
              )}
              {!rune?.isConfident && (
                <span className="text-accent-secondary ml-2">?</span>
              )}
            </h2>

            {rune?.note && (
              <div className="col-span-2 text-secondary text-sm w-full text-center h-8 flex items-center justify-center break-all truncate">
                {rune.note}
              </div>
            )}

            {onAddRuneForChain && rune?.lines ? (
              <IconButton
                Icon={Plus}
                color={ButtonColor.CYAN}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => rune.lines && onAddRuneForChain(rune.lines)}
                title="Add this rune to the chain being edited"
                className="absolute top-2 left-2 p-1"
              />
            ) : (
              !isOtherFormActive && (
                <div
                  className={cn(
                    "absolute bottom-3 right-3 flex flex-col gap-2",
                    hiddenButtonClasses
                  )}
                >
                  <IconButton
                    Icon={Trash2}
                    color={ButtonColor.RED}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleDelete}
                    title="Delete"
                  />
                  <IconButton
                    Icon={Pencil}
                    color={ButtonColor.CYAN}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleEdit}
                    title="Edit"
                  />
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default memo(RuneCard)
