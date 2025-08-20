import { useConfig } from "@/context/ConfigContext"
import { cn } from "@/styles"
import { RuneLines } from "@/types"
import React from "react"

// --- COORDINATE SYSTEM & DEFINITIONS ---
// The coordinate system is centered at (0,0) which is the middle line.
// Diamond Width = 100, Diamond Height = 60. (Ratio 100/60 = 5/3)
// Offset from middle line = 1/3 Height = 20.

// Upper Diamond: y from -80 to -20
// Lower Diamond: y from 20 to 80

const RUNE_LINES = [
  // 0-3: Upper diamond sides
  { index: 0, path: "M 0 -80 L -50 -50" }, // Upper Left
  { index: 1, path: "M 0 -80 L 50 -50" }, // Upper Right
  { index: 2, path: "M -50 -50 L 0 -20" }, // Lower Left
  { index: 3, path: "M 50 -50 L 0 -20" }, // Lower Right

  // 4-7: Lower diamond sides
  { index: 4, path: "M 0 20 L -50 50" }, // Upper Left
  { index: 5, path: "M 0 20 L 50 50" }, // Upper Right
  { index: 6, path: "M -50 50 L 0 80" }, // Lower Left
  { index: 7, path: "M 50 50 L 0 80" }, // Lower Right

  // 8-9: Vertical bisectors
  { index: 8, path: "M 0 -80 L 0 -20" }, // Upper bisector
  { index: 9, path: "M 0 20 L 0 80" }, // Lower bisector
]

// New broken left connector, controlled by a single boolean at index 10
const LEFT_CONNECTOR_SEGMENTS = {
  index: 10,
  paths: [
    "M -50 -50 L -50 0", // Upper segment
    "M -50 20 L -50 50", // Lower segment
  ],
}

// Reverse circle, controlled by index 11
const REVERSE_CIRCLE = {
  index: 11,
  cx: -40,
  cy: 75,
  r: 8,
}

// This segment connects the upper diamond to the middle line.
// Its visibility is controlled by the LOWER diamond's bisector (index 9).
const DEPENDENT_CONNECTOR = {
  path: "M 0 -20 L 0 0",
  controllerIndices: [8, 9],
}

const getDynamicViewBox = (chainPosition?: "first" | "middle" | "last") => {
  const strokeWidth = 5
  const halfStroke = strokeWidth / 2
  const contentWidth = 100
  const halfContent = contentWidth / 2

  let minX: number
  let width: number

  switch (chainPosition) {
    case "first":
    case "middle":
    case "last": {
      minX = -halfStroke - halfContent
      width = contentWidth
      break
    }
    default: {
      minX = -strokeWidth * 2 - halfContent
      width = strokeWidth * 4 + contentWidth
      break
    }
  }

  return `${minX} -90 ${width} 180`
}

interface RuneEditorProps {
  isEditing: boolean
  runeState: RuneLines
  setRuneState: (newState: RuneLines) => void
  chainPosition?: "first" | "middle" | "last"
}

export default function RuneEditor({
  isEditing,
  runeState,
  setRuneState,
  chainPosition,
}: RuneEditorProps) {
  const { showInactiveLines } = useConfig()

  const handleToggle = (index: number) => {
    if (!isEditing) return
    const newState = [...runeState] as RuneLines
    newState[index] = !newState[index]
    setRuneState(newState)
  }

  const activeClass = "stroke-accent"
  const inactiveClass = "stroke-muted"

  const isDependentConnectorActive = DEPENDENT_CONNECTOR.controllerIndices.some(
    (i) => runeState[i]
  )

  // TODO add custom pointerenter/pointerleave handlers
  return (
    <div className="w-auto h-auto">
      <svg
        viewBox={getDynamicViewBox(chainPosition)}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- DEPENDENT CONNECTOR --- */}
        {(isDependentConnectorActive || isEditing || showInactiveLines) && (
          <path
            d={DEPENDENT_CONNECTOR.path}
            strokeWidth="5"
            strokeLinecap="round"
            className={cn(
              isDependentConnectorActive ? activeClass : inactiveClass
            )}
          />
        )}

        {/* --- RUNE SEGMENTS --- */}
        {RUNE_LINES.toSorted((a) => (runeState[a.index] ? 1 : -1)).map(
          ({ index, path }) => {
            const isActive = runeState[index]
            if (!isActive && !isEditing && !showInactiveLines) return null

            return (
              <g
                key={index}
                className={cn(isEditing && "group/line cursor-pointer")}
                onClick={() => handleToggle(index)}
              >
                <path
                  d={path}
                  strokeWidth="5"
                  strokeLinecap="round"
                  className={cn(
                    isActive ? activeClass : inactiveClass,
                    isEditing &&
                      (isActive
                        ? "group-hover/line:stroke-accent-highlight group-hover/line:z-10"
                        : "group-hover/line:stroke-muted-highlight")
                  )}
                />
                {isEditing && (
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                )}
              </g>
            )
          }
        )}

        {/* --- LEFT CONNECTOR --- */}
        {(() => {
          const isActive = runeState[LEFT_CONNECTOR_SEGMENTS.index]
          if (!isActive && !isEditing && !showInactiveLines) return null

          return (
            <g
              className={cn(isEditing && "group/line cursor-pointer")}
              onClick={() => handleToggle(LEFT_CONNECTOR_SEGMENTS.index)}
            >
              {LEFT_CONNECTOR_SEGMENTS.paths.map((p, i) => (
                <path
                  key={`l-conn-vis-${i}`}
                  d={p}
                  strokeWidth="5"
                  strokeLinecap="round"
                  className={cn(
                    isActive ? activeClass : inactiveClass,
                    isEditing &&
                      (isActive
                        ? "group-hover/line:stroke-accent-highlight"
                        : "group-hover/line:stroke-muted-highlight")
                  )}
                />
              ))}
              {isEditing &&
                LEFT_CONNECTOR_SEGMENTS.paths.map((p, i) => (
                  <path
                    key={`l-conn-click-${i}`}
                    d={p}
                    stroke="transparent"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                ))}
            </g>
          )
        })()}

        {/* --- REVERSE CIRCLE --- */}
        {(() => {
          const isActive = runeState[REVERSE_CIRCLE.index]
          if (!isActive && !isEditing && !showInactiveLines) return null
          const { cx, cy, r } = REVERSE_CIRCLE

          return (
            <g
              className={cn(isEditing && "group/line cursor-pointer")}
              onClick={() => handleToggle(REVERSE_CIRCLE.index)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                strokeWidth="5"
                fill="none"
                className={cn(
                  isActive ? activeClass : inactiveClass,
                  isEditing &&
                    (isActive
                      ? "group-hover/line:stroke-accent-highlight"
                      : "group-hover/line:stroke-muted-highlight")
                )}
              />
              {isEditing && (
                <circle cx={cx} cy={cy} strokeWidth="20" fill="transparent" />
              )}
            </g>
          )
        })()}

        {/* --- ALWAYS ON MIDDLE LINE --- */}
        <path
          d="M -50 0 L 50 0"
          strokeWidth="5"
          strokeLinecap="round"
          className={activeClass}
        />
      </svg>
    </div>
  )
}
