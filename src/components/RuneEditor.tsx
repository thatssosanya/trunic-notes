import { useConfig } from "@/context/ConfigContext"
import React from "react"

// --- NEW COORDINATE SYSTEM & DEFINITIONS ---
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
  controllerIndex: 9,
}

interface RuneEditorProps {
  isEditing: boolean
  runeState: boolean[]
  setRuneState: (newState: boolean[]) => void
}

export default function RuneEditor({
  isEditing,
  runeState,
  setRuneState,
}: RuneEditorProps) {
  const { showInactiveLines } = useConfig()

  const handleToggle = (index: number) => {
    const newState = [...runeState]
    newState[index] = !newState[index]
    setRuneState(newState)
  }

  const activeClass = "stroke-cyan-300"
  const inactiveClass = "stroke-gray-700"

  const SvgPath = ({ path, isActive }: { path: string; isActive: boolean }) => (
    <path
      d={path}
      strokeWidth="5"
      strokeLinecap="round"
      className={isActive ? activeClass : inactiveClass}
    />
  )

  const SvgCircle = ({
    cx,
    cy,
    r,
    isActive,
  }: {
    cx: number
    cy: number
    r: number
    isActive: boolean
  }) => (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      strokeWidth="5"
      fill="none"
      className={isActive ? activeClass : inactiveClass}
    />
  )

  const activeElements = RUNE_LINES.filter((el) => runeState[el.index])
  const inactiveElements = RUNE_LINES.filter((el) => !runeState[el.index])

  const isLeftConnectorActive = runeState[LEFT_CONNECTOR_SEGMENTS.index]
  const isCircleActive = runeState[REVERSE_CIRCLE.index]
  const isDependentConnectorActive =
    runeState[DEPENDENT_CONNECTOR.controllerIndex]

  return (
    <div className="w-auto h-auto">
      <svg viewBox="-60 -90 120 180" xmlns="http://www.w3.org/2000/svg">
        {/* --- INACTIVE ELEMENTS (BOTTOM LAYER) --- */}
        {(isEditing || showInactiveLines) && (
          <g className="inactive-elements">
            {inactiveElements.map(({ index, path }) => (
              <SvgPath key={index} path={path} isActive={false} />
            ))}
            {!isLeftConnectorActive &&
              LEFT_CONNECTOR_SEGMENTS.paths.map((p, i) => (
                <SvgPath key={`l-conn-i-${i}`} path={p} isActive={false} />
              ))}
            {!isCircleActive && (
              <SvgCircle {...REVERSE_CIRCLE} isActive={false} />
            )}
            {!isDependentConnectorActive && (
              <SvgPath path={DEPENDENT_CONNECTOR.path} isActive={false} />
            )}
          </g>
        )}

        {/* --- ACTIVE ELEMENTS (TOP LAYER) --- */}
        <g className="active-elements">
          {activeElements.map(({ index, path }) => (
            <SvgPath key={index} path={path} isActive={true} />
          ))}
          {isLeftConnectorActive &&
            LEFT_CONNECTOR_SEGMENTS.paths.map((p, i) => (
              <SvgPath key={`l-conn-a-${i}`} path={p} isActive={true} />
            ))}
          {isCircleActive && <SvgCircle {...REVERSE_CIRCLE} isActive={true} />}
          {isDependentConnectorActive && (
            <SvgPath path={DEPENDENT_CONNECTOR.path} isActive={true} />
          )}
        </g>

        {/* --- ALWAYS-ON MIDDLE LINE --- */}
        <path
          d="M -50 0 L 50 0"
          strokeWidth="5"
          strokeLinecap="round"
          className={activeClass}
        />

        {/* --- CLICK HANDLERS --- */}
        {isEditing && (
          <g className="click-handlers">
            {RUNE_LINES.map(({ index, path }) => (
              <path
                key={`click-${index}`}
                d={path}
                stroke="transparent"
                strokeWidth="20"
                className="cursor-pointer"
                onClick={() => handleToggle(index)}
              />
            ))}
            <g
              className="cursor-pointer"
              onClick={() => handleToggle(LEFT_CONNECTOR_SEGMENTS.index)}
            >
              {LEFT_CONNECTOR_SEGMENTS.paths.map((p, i) => (
                <path
                  key={`click-l-conn-${i}`}
                  d={p}
                  stroke="transparent"
                  strokeWidth="20"
                />
              ))}
            </g>
            <circle
              cx={REVERSE_CIRCLE.cx}
              cy={REVERSE_CIRCLE.cy}
              r={REVERSE_CIRCLE.r + 5}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => handleToggle(REVERSE_CIRCLE.index)}
            />
          </g>
        )}
      </svg>
    </div>
  )
}
