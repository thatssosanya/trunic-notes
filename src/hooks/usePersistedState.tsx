import { useState, useEffect, Dispatch, SetStateAction } from "react"

export default function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue)

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(key)
      if (storedValue !== null) {
        setState(JSON.parse(storedValue))
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error)
    }
  }, [key])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error)
    }
  }, [key, state])

  return [state, setState]
}
