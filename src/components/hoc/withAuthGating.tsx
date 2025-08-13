import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { JSX, useEffect } from "react"

function AuthGate({
  requiredAuthState,
  children,
}: React.PropsWithChildren<{ requiredAuthState: boolean }>) {
  const { status } = useSession()
  const router = useRouter()

  const allowed = requiredAuthState
    ? status === "authenticated"
    : status === "unauthenticated"

  useEffect(() => {
    if (status === "loading" || allowed) {
      return
    }
    if (status === "authenticated") {
      router.push("/notes")
    } else if (status === "unauthenticated") {
      router.push("/")
    }
  }, [allowed, status, router])

  return status === "loading" || !allowed ? (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-cyan-300 animate-spin" />
    </main>
  ) : (
    children
  )
}

export default function withAuthGating<T extends JSX.IntrinsicAttributes>(
  Component: React.FC<T>,
  requiredAuthState = true
) {
  function WrappedComponent(props: T) {
    return (
      <AuthGate requiredAuthState={requiredAuthState}>
        <Component {...props} />
      </AuthGate>
    )
  }
  return WrappedComponent
}
