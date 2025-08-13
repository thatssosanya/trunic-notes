import { useEffect, useState } from "react"

const useCallbackOnce = (callback: () => unknown) => {
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

export default useCallbackOnce
