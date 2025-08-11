import React from "react"

// --- ELEMENT DEFINITIONS ---

// Standard lines (Indices 0-10)
const RUNE_LINES = [
  // 0-3: Upper diamond
  { index: 0, path: "M 50 0 L 0 40" },
  { index: 1, path: "M 50 0 L 100 40" },
  { index: 2, path: "M 0 40 L 50 80" },
  { index: 3, path: "M 100 40 L 50 80" },
  // 4-7: Lower diamond
  { index: 4, path: "M 50 80 L 0 120" },
  { index: 5, path: "M 50 80 L 100 120" },
  { index: 6, path: "M 0 120 L 50 160" },
  { index: 7, path: "M 100 120 L 50 160" },
  // 8-10: Bisectors
  { index: 8, path: "M 50 0 L 50 80" },
  { index: 9, path: "M 50 80 L 50 160" },
  { index: 10, path: "M 0 80 L 100 80" },
]

// Special vertical connector line (Index 11)
const LEFT_CONNECTOR_LINE = {
  index: 11,
  path: "M 0 40 L 0 120",
}

// Special reverse indicator circle (Index 12)
const REVERSE_CIRCLE = {
  index: 12,
  cx: 15, // x-coordinate of circle center
  cy: 150, // y-coordinate of circle center
  r: 10, // radius
}

// --- PROPS ---

interface RuneEditorProps {
  runeState: boolean[]
  setRuneState: (newState: boolean[]) => void
}

// --- COMPONENT ---

export default function RuneEditor({
  runeState,
  setRuneState,
}: RuneEditorProps) {
  const handleToggle = (index: number) => {
    const newState = [...runeState]
    newState[index] = !newState[index]
    setRuneState(newState)
  }

  const activeClass = "stroke-cyan-300"
  const inactiveClass = "stroke-gray-700"

  // Helper component for drawing a standard path-based line
  const SvgPath = ({ path, isActive }: { path: string; isActive: boolean }) => (
    <path
      d={path}
      strokeWidth="5"
      strokeLinecap="round"
      className={isActive ? activeClass : inactiveClass}
    />
  )

  // Helper component for drawing the circle
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

  // Separate elements into active and inactive groups for correct layering
  const activeElements = RUNE_LINES.filter((el) => runeState[el.index])
  const inactiveElements = RUNE_LINES.filter((el) => !runeState[el.index])

  const isConnectorActive = runeState[LEFT_CONNECTOR_LINE.index]
  const isCircleActive = runeState[REVERSE_CIRCLE.index]

  return (
    <div className="w-auto h-auto">
      <svg viewBox="-10 -10 120 180" xmlns="http://www.w3.org/2000/svg">
        <g className="inactive-elements">
          {inactiveElements.map(({ index, path }) => (
            <SvgPath key={index} path={path} isActive={false} />
          ))}
          {!isConnectorActive && (
            <SvgPath path={LEFT_CONNECTOR_LINE.path} isActive={false} />
          )}
          {!isCircleActive && (
            <SvgCircle {...REVERSE_CIRCLE} isActive={false} />
          )}
        </g>

        {/* --- RENDER ACTIVE ELEMENTS SECOND (TOP LAYER) --- */}
        <g className="active-elements">
          {activeElements.map(({ index, path }) => (
            <SvgPath key={index} path={path} isActive={true} />
          ))}
          {isConnectorActive && (
            <SvgPath path={LEFT_CONNECTOR_LINE.path} isActive={true} />
          )}
          {isCircleActive && <SvgCircle {...REVERSE_CIRCLE} isActive={true} />}
        </g>

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
          <path
            d={LEFT_CONNECTOR_LINE.path}
            stroke="transparent"
            strokeWidth="20"
            className="cursor-pointer"
            onClick={() => handleToggle(LEFT_CONNECTOR_LINE.index)}
          />
          <circle
            cx={REVERSE_CIRCLE.cx}
            cy={REVERSE_CIRCLE.cy}
            r={REVERSE_CIRCLE.r + 5}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => handleToggle(REVERSE_CIRCLE.index)}
          />
        </g>
      </svg>
    </div>
  )
}
