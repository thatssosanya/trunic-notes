import { useCallback, useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import withAuthGating from "@/components/hoc/withAuthGating"

function AuthPage() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignin = useCallback(async () => {
    setIsLoading(true)
    setError("")

    const result = await signIn("credentials", {
      redirect: false,
      name,
      password,
    })

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }, [setIsLoading, setError, name, password])

  const handleSignup = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, password }),
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!")
      }

      await handleSignin()
    } catch (error) {
      setError(
        error instanceof Object &&
          "message" in error &&
          typeof error.message === "string"
          ? error.message
          : JSON.stringify(error)
      )
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault()
        handleSignin()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleSignin])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-cyan-300">Trunic Notes</h1>
      </div>

      <div className="w-full max-w-sm bg-gray-800 shadow-md rounded-lg p-8 pt-6 space-y-4">
        <div>
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Username
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
            id="username"
            type="text"
            placeholder="Username"
            required
          />
        </div>
        <div>
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
            id="password"
            type="password"
            placeholder="Password"
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-red-500 text-xs italic">{error}</p>}
        <div className="flex items-center justify-between gap-4">
          <button
            disabled={isLoading}
            onClick={handleSignin}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-600 w-full flex items-center justify-center cursor-pointer"
            type="submit"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
          <button
            disabled={isLoading}
            onClick={handleSignup}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-600 w-full flex items-center justify-center cursor-pointer"
            type="submit"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </div>
      </div>
    </main>
  )
}

export default withAuthGating(AuthPage, false)
