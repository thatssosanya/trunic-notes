import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import RuneCard from "./RuneCard"

interface SortableRuneCardProps extends React.ComponentProps<typeof RuneCard> {
  isDndDisabled: boolean
}
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
    disabled: props.isEditing || props.isDndDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: props.isEditing || props.isDndDisabled ? "default" : "grab",
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(props.isEditing || props.isDndDisabled ? {} : attributes)}
      {...(props.isEditing || props.isDndDisabled ? {} : listeners)}
    >
      <RuneCard {...props} />
    </div>
  )
}
