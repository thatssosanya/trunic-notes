import { createApiHandler, ApiHandler } from "@/lib/api/createApiHandler"
import { createChainSchema } from "@/lib/validation/chainSchemas"
import { createChain, getAllChains } from "@/services/chain"

const handleGet: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const chains = await getAllChains(userId)
  res.status(200).json(chains)
}

const handlePost: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const validatedData = createChainSchema.parse(req.body)

  const newChain = await createChain(validatedData, userId)
  res.status(201).json(newChain)
}

export default createApiHandler({
  GET: handleGet,
  POST: handlePost,
})
