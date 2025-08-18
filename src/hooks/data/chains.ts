import { Chain, ChainData } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const fetchChains = async (): Promise<Chain[]> => {
  const response = await fetch("/api/chains")
  if (!response.ok) throw new Error("Failed to fetch chains")
  return response.json()
}

export const useChains = () => {
  return useQuery<Chain[], Error>({
    queryKey: ["chains"],
    queryFn: fetchChains,
  })
}

export const useSaveChain = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: ChainData & { id?: string }) => {
      let response: Response | null = null
      if (id) {
        response = await fetch("/api/chains/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else {
        response = await fetch("/api/chains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      if (!response?.ok) throw new Error("Failed to save chain")
      return response.json()
    },
    onMutate: async (newChainData: ChainData & { id?: string }) => {
      await queryClient.cancelQueries({ queryKey: ["chains"] })

      const previousChains = queryClient.getQueryData<Chain[]>(["chains"])

      if (previousChains) {
        let newChains: Chain[] = []
        if (newChainData.id) {
          newChains = previousChains.map((chain) =>
            chain.id === newChainData.id ? { ...chain, ...newChainData } : chain
          )
        } else {
          const optimisticChain: Chain = {
            ...newChainData,
            id: `optimistic-${Date.now()}`,
            sequence: Math.max(
              ...previousChains?.map((chain) => chain.sequence)
            ),
          }
          newChains = [...previousChains, optimisticChain]
        }
        queryClient.setQueryData<Chain[]>(["chains"], newChains)
      }

      return { previousChains }
    },
    onError: (err, newChain, context) => {
      if (context?.previousChains) {
        queryClient.setQueryData(["chains"], context.previousChains)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] })
    },
  })
}

export const useDeleteChain = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/chains/" + id, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete chain")
    },
    onMutate: async (idToDelete: string) => {
      await queryClient.cancelQueries({ queryKey: ["chains"] })

      const previousChains = queryClient.getQueryData<Chain[]>(["chains"])

      const newChains = previousChains
        ? previousChains.filter((chain) => chain.id !== idToDelete)
        : []

      queryClient.setQueryData<Chain[]>(["chains"], newChains)

      return { previousChains }
    },
    onError: (err, id, context) => {
      if (context?.previousChains) {
        queryClient.setQueryData(["chains"], context.previousChains)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] })
    },
  })
}
