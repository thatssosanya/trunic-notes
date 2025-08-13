import { useState, useEffect } from "react"

function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const media = window.matchMedia(query)

    setMatches(media.matches)

    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)

    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}

export function useIsMobile() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  return isMobile
}

export default useMediaQuery
