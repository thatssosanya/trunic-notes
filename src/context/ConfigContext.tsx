"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

// Add isCompact to the context type
interface ConfigContextType {
  showInactiveLines: boolean
  setShowInactiveLines: (show: boolean) => void
  isVerticalCards: boolean
  setIsVerticalCards: (compact: boolean) => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [showInactiveLines, setShowInactiveLines] = useState(false)
  // Add state for the compact view, defaulting to false
  const [isVerticalCards, setIsVerticalCards] = useState(false)

  return (
    <ConfigContext.Provider
      value={{
        showInactiveLines,
        setShowInactiveLines,
        isVerticalCards,
        setIsVerticalCards,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

// The custom hook remains the same
export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return context
}
