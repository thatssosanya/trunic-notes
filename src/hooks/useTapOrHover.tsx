import { useCallback, useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/useMediaQuery"

export default function useTapOrHover({ isDisabled }: { isDisabled: boolean }) {
  const [isTapped, setIsTapped] = useState(false)

  const elementRef = useRef<HTMLDivElement>(null)
  const pointerDownTimeRef = useRef(0)
  const isDraggingRef = useRef(false)

  const isMobile = useIsMobile()

  const registerTap = () => {
    if (!isMobile || isDisabled) {
      return
    }
    setIsTapped((v) => !v)
  }

  const handlePointerDown = useCallback(() => {
    isDraggingRef.current = false
    pointerDownTimeRef.current = Date.now()
  }, [])

  const handlePointerUp = () => {
    const elapsed = Date.now() - pointerDownTimeRef.current
    if (!isDraggingRef.current && elapsed < 200) {
      registerTap()
    }
  }

  const handlePointerMove = useCallback(() => {
    isDraggingRef.current = true
  }, [])

  useEffect(() => {
    if (!isTapped) return

    function handleClickOutside(event: MouseEvent) {
      if (
        elementRef.current &&
        !elementRef.current.contains(event.target as Node)
      ) {
        setIsTapped(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isTapped])

  const buttonClasses = `
      transition-opacity
      opacity-0 md:group-hover:opacity-100
      ${isMobile && isTapped && "opacity-100"}
      ${isMobile && !isTapped && "pointer-events-none"}
      md:pointer-events-auto
    `

  return {
    elementRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onClick: handlePointerUp,
      onPointerMove: handlePointerMove,
    },
    buttonClasses,
  }
}
