import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Rune, RuneData } from "@/types"

const fetchRunes = async (): Promise<Rune[]> => {
  const response = await fetch("/api/runes")
  if (!response.ok) throw new Error("Failed to fetch runes")
  return response.json()
}

export const useRunes = () => {
  return useQuery<Rune[], Error>({ queryKey: ["runes"], queryFn: fetchRunes })
}

export const useSaveRune = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: RuneData & { id?: string }) => {
      let response: Response | null = null

      if (id) {
        response = await fetch("/api/runes/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else {
        response = await fetch("/api/runes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      if (!response?.ok) throw new Error("Failed to save rune")
      return response.json()
    },
    onMutate: async (newRuneData: RuneData & { id?: string }) => {
      await queryClient.cancelQueries({ queryKey: ["runes"] })

      const previousRunes = queryClient.getQueryData<Rune[]>(["runes"]) || []

      if (previousRunes) {
        let newRunes: Rune[] = []
        if (newRuneData.id) {
          newRunes = previousRunes?.map((rune) =>
            rune.id === newRuneData.id ? { ...rune, ...newRuneData } : rune
          )
        } else {
          const optimisticRune: Rune = {
            ...newRuneData,
            id: `optimistic-${Date.now()}`,
            sequence: Math.max(...previousRunes?.map((rune) => rune.sequence)),
          }
          newRunes = [...previousRunes, optimisticRune]
        }

        queryClient.setQueryData<Rune[]>(["runes"], newRunes)
      }

      return { previousRunes }
    },
    onError: (err, newRune, context) => {
      if (context?.previousRunes) {
        queryClient.setQueryData(["runes"], context.previousRunes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["runes"] })
    },
  })
}

export const useDeleteRune = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/runes/" + id, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete rune")
    },
    onMutate: async (idToDelete: string) => {
      await queryClient.cancelQueries({ queryKey: ["runes"] })

      const previousRunes = queryClient.getQueryData<Rune[]>(["runes"])

      const newRunes = previousRunes
        ? previousRunes.filter((rune) => rune.id !== idToDelete)
        : []

      queryClient.setQueryData<Rune[]>(["runes"], newRunes)

      return { previousRunes }
    },
    onError: (err, id, context) => {
      if (context?.previousRunes) {
        queryClient.setQueryData(["runes"], context.previousRunes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["runes"] })
    },
  })
}

export const useUpdateRuneOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const response = await fetch("/api/runes/ordering", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      })
      if (!response.ok) throw new Error("Failed to reorder runes")
    },
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["runes"] })
      const previousRunes = queryClient.getQueryData<Rune[]>(["runes"])

      if (previousRunes) {
        const newRunes = orderedIds.map(
          (id) => previousRunes.find((r) => r.id === id)!
        )

        queryClient.setQueryData(["runes"], newRunes)
      }

      return { previousRunes }
    },
    onError: (err, newOrder, context) => {
      if (context?.previousRunes) {
        queryClient.setQueryData(["runes"], context.previousRunes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["runes"] })
    },
  })
}
