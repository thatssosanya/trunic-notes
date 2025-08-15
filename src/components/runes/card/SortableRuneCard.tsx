import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import RuneCard from "@/components/runes/card"

interface SortableRuneCardProps extends React.ComponentProps<typeof RuneCard> {
  isDndDisabled: boolean
}
export default function SortableRuneCard(props: SortableRuneCardProps) {
  const isDisabled = !props.rune?.id || props.isDndDisabled

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.rune?.id || "newRune",
    disabled: isDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDisabled ? "default" : "grab",
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDisabled ? {} : attributes)}
      {...(isDisabled ? {} : listeners)}
    >
      <RuneCard {...props} />
    </div>
  )
}
