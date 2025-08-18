import { useEffect, useState } from "react"

const useCallbackUntilSignal = (callback: () => unknown) => {
  const [isSignaled, setIsSignaled] = useState(false)
  useEffect(() => {
    if (isSignaled) {
      return
    }
    const result = callback()
    if (result) {
      setIsSignaled(true)
    }
  }, [callback, isSignaled, setIsSignaled])
}

export default useCallbackUntilSignal
