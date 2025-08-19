import { useConfig } from "@/context/ConfigContext"
import ConfigControls from "@/components/ConfigControls"
import withAuthGating from "@/components/hoc/withAuthGating"
import { signOut } from "next-auth/react"
import { ChevronDown } from "lucide-react"
import ChainCollection from "@/components/chains/ChainCollection"
import RuneCollection from "@/components/runes/RuneCollection"
import { useCallback, useEffect, useState } from "react"
import { RuneLines } from "@/types"
import { useAppState } from "@/context/AppStateContext"
import { EditStates } from "@/utils/enums"
import Head from "next/head"
import { cn } from "@/styles"

function Notes() {
  const { isMenuOpen, setIsMenuOpen } = useConfig()
  const { editState, addRune } = useAppState()

  const [copiedRune, setCopiedRune] = useState<RuneLines | null>(null)
  const onCopyRune = useCallback(
    (lines: RuneLines) => {
      setCopiedRune(lines)
      addRune()
    },
    [addRune]
  )
  useEffect(() => {
    if (editState === EditStates.IDLE) {
      setCopiedRune(null)
    }
  }, [editState])

  const [runeForChain, setRuneForChain] = useState<RuneLines | null>(null)
  const consumeRuneForChain = useCallback(() => {
    const rune = runeForChain
    setRuneForChain(null)
    return rune
  }, [runeForChain])

  const [runeIdToScroll, setRuneIdToScroll] = useState<string | null>(null)
  const onScrollComplete = useCallback(() => setRuneIdToScroll(null), [])

  return (
    <main className="min-h-screen flex flex-col p-8 bg-gray-900 text-white">
      <Head>
        <title>Trunic Notes</title>
      </Head>
      <div className="text-center mb-6">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center gap-3 group cursor-pointer"
        >
          <h1 className="text-4xl font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
            Trunic Notes
          </h1>
          <ChevronDown
            className={cn(
              "text-cyan-400 transition-transform rotate-0",
              isMenuOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      {isMenuOpen && <ConfigControls />}

      <ChainCollection
        onCopyRune={onCopyRune}
        consumeRuneForChain={consumeRuneForChain}
        onScrollToRune={setRuneIdToScroll}
      />

      <RuneCollection
        copiedRune={copiedRune}
        onAddRuneForChain={setRuneForChain}
        runeIdToScroll={runeIdToScroll}
        onScrollComplete={onScrollComplete}
      />

      <div className="mt-auto w-full flex justify-center pt-4">
        <button
          className="text-xs text-gray-300 underline cursor-pointer hover:no-underline"
          onClick={() => signOut()}
        >
          Log out
        </button>
      </div>
    </main>
  )
}

export default withAuthGating(Notes)
