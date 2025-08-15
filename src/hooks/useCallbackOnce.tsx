import { useEffect, useState } from "react"

const useCallbackUntilSignal = (callback: () => unknown) => {
  const [used, setUsed] = useState(false)
  useEffect(() => {
    if (used) {
      return
    }
    const result = callback()
    if (result) {
      setUsed(true)
    }
  }, [callback, used, setUsed])
}

export default useCallbackUntilSignal
