import { useConfig } from "@/context/ConfigContext"
import { cn } from "@/styles"
import { RuneLines } from "@/types"
import React, { useState } from "react"

// --- COORDINATE SYSTEM & DEFINITIONS ---
// The coordinate system is centered at (0,0) which is the middle line.
// Diamond Width = 100, Diamond Height = 60. (Ratio 100/60 = 5/3)
// Offset from middle line = 1/3 Height = 20.

// Upper Diamond: y from -80 to -20
// Lower Diamond: y from 20 to 80

const TOGGLEABLE_LINES = [
  // 0-3: Upper diamond sides
  { index: 0, paths: ["M 0 -80 L -50 -50"] }, // Upper Left
  { index: 1, paths: ["M 0 -80 L 50 -50"] }, // Upper Right
  { index: 2, paths: ["M -50 -50 L 0 -20"] }, // Lower Left
  { index: 3, paths: ["M 50 -50 L 0 -20"] }, // Lower Right

  // 4-7: Lower diamond sides
  { index: 4, paths: ["M 0 20 L -50 50"] }, // Upper Left
  { index: 5, paths: ["M 0 20 L 50 50"] }, // Upper Right
  { index: 6, paths: ["M -50 50 L 0 80"] }, // Lower Left
  { index: 7, paths: ["M 50 50 L 0 80"] }, // Lower Right

  // 8-9: Vertical bisectors
  { index: 8, paths: ["M 0 -80 L 0 -20"] }, // Upper bisector
  { index: 9, paths: ["M 0 20 L 0 80"] }, // Lower bisector

  // 10: Broken left connector
  {
    index: 10,
    paths: [
      "M -50 -50 L -50 0", // Upper segment
      "M -50 20 L -50 50", // Lower segment
    ],
  },
]

// Reverse circle, controlled by index 11
const REVERSE_CIRCLE = {
  index: 11,
  cx: -40,
  cy: 75,
  r: 8,
}

// This segment connects the upper diamond to the middle line.
// Its visibility is controlled by either bisector (indices 8, 9).
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    const newState = [...runeState] as RuneLines
    newState[index] = !newState[index]
    if (isEditing) {
      setRuneState(newState)
    }
  }

  const SvgPath = ({
    path,
    isActive,
    isHovered,
  }: {
    path: string
    isActive: boolean
    isHovered: boolean
  }) => (
    <path
      d={path}
      strokeWidth="5"
      strokeLinecap="round"
      className={cn(
        isEditing && isHovered
          ? isActive
            ? "stroke-accent-highlight"
            : "stroke-muted-highlight"
          : isActive
          ? "stroke-accent"
          : "stroke-muted"
      )}
    />
  )

  const SvgCircle = ({
    cx,
    cy,
    r,
    isActive,
    isHovered,
  }: {
    cx: number
    cy: number
    r: number
    isActive: boolean
    isHovered: boolean
  }) => (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      strokeWidth="5"
      fill="none"
      className={cn(
        isEditing && isHovered
          ? isActive
            ? "stroke-accent-highlight"
            : "stroke-muted-highlight"
          : isActive
          ? "stroke-accent"
          : "stroke-muted"
      )}
    />
  )

  const activeElements = TOGGLEABLE_LINES.toSorted((a) =>
    hoveredIndex === a.index ? 1 : 0
  ).filter((el) => runeState[el.index])

  const inactiveElements = TOGGLEABLE_LINES.toSorted((a) =>
    hoveredIndex === a.index ? 1 : 0
  ).filter((el) => !runeState[el.index])

  const isCircleActive = runeState[REVERSE_CIRCLE.index]
  const isDependentConnectorActive = DEPENDENT_CONNECTOR.controllerIndices.some(
    (i) => runeState[i]
  )

  return (
    <div className="w-auto h-auto">
      <svg
        viewBox={getDynamicViewBox(chainPosition)}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- INACTIVE ELEMENTS (BOTTOM LAYER) --- */}
        {(isEditing || showInactiveLines) && (
          <g className="inactive-elements">
            {!isDependentConnectorActive && (
              <SvgPath
                path={DEPENDENT_CONNECTOR.path}
                isActive={false}
                isHovered={false}
              />
            )}
            {inactiveElements.map(({ index, paths }) =>
              paths.map((path, i) => (
                <SvgPath
                  key={`path-${index}-${i}`}
                  path={path}
                  isActive={false}
                  isHovered={hoveredIndex === index}
                />
              ))
            )}
            {!isCircleActive && (
              <SvgCircle
                {...REVERSE_CIRCLE}
                isActive={false}
                isHovered={hoveredIndex === REVERSE_CIRCLE.index}
              />
            )}
          </g>
        )}

        {/* --- ALWAYS-ON MIDDLE LINE --- */}
        <path
          d="M -50 0 L 50 0"
          strokeWidth="5"
          strokeLinecap="round"
          className={"stroke-accent"}
        />

        {/* --- ACTIVE ELEMENTS (TOP LAYER) --- */}
        <g className="active-elements">
          {isDependentConnectorActive && (
            <SvgPath
              path={DEPENDENT_CONNECTOR.path}
              isActive={true}
              isHovered={false}
            />
          )}
          {activeElements.map(({ index, paths }) =>
            paths.map((path, i) => (
              <SvgPath
                key={`path-${index}-${i}`}
                path={path}
                isActive={true}
                isHovered={hoveredIndex === index}
              />
            ))
          )}
          {isCircleActive && (
            <SvgCircle
              {...REVERSE_CIRCLE}
              isActive={true}
              isHovered={hoveredIndex === REVERSE_CIRCLE.index}
            />
          )}
        </g>

        {/* --- CLICK HANDLERS --- */}
        {isEditing && (
          <g
            className="click-handlers"
            onPointerLeave={() => setHoveredIndex(null)}
          >
            {TOGGLEABLE_LINES.map(({ index, paths }) => (
              <g
                key={`click-group-${index}`}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredIndex(index)}
                onClick={() => handleToggle(index)}
              >
                {paths.map((path, i) => (
                  <path
                    key={`click-path-${index}-${i}`}
                    d={path}
                    stroke="transparent"
                    strokeWidth="20"
                  />
                ))}
              </g>
            ))}
            <circle
              cx={REVERSE_CIRCLE.cx}
              cy={REVERSE_CIRCLE.cy}
              r={REVERSE_CIRCLE.r + 5}
              fill="transparent"
              className="cursor-pointer"
              onPointerEnter={() => setHoveredIndex(REVERSE_CIRCLE.index)}
              onClick={() => handleToggle(REVERSE_CIRCLE.index)}
            />
          </g>
        )}
      </svg>
    </div>
  )
}
