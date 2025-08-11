import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import RuneCard from "./RuneCard"

// Pass all the props of RuneCard down
type SortableRuneCardProps = React.ComponentProps<typeof RuneCard>

export function SortableRuneCard(props: SortableRuneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.rune!.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RuneCard {...props} />
    </div>
  )
}
