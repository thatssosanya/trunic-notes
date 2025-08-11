import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import RuneCard from "./RuneCard"

type SortableRuneCardProps = React.ComponentProps<typeof RuneCard>

export function SortableRuneCard(props: SortableRuneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.rune!.id,
    // This is the key change: disable dragging if the card is being edited
    disabled: props.isEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // When editing, remove the grab cursor by disabling listeners
    cursor: props.isEditing ? "default" : "grab",
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    // Only apply DnD listeners if not editing
    <div
      ref={setNodeRef}
      style={style}
      {...(props.isEditing ? {} : attributes)}
      {...(props.isEditing ? {} : listeners)}
    >
      <RuneCard {...props} />
    </div>
  )
}
