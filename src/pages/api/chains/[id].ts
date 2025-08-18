import { createApiHandler, ApiHandler } from "@/lib/api/createApiHandler"
import { updateChainSchema } from "@/lib/validation/chainSchemas"
import { getQueryParam } from "@/lib/api/utils"
import { deleteChain, updateChain } from "@/services/chain"

const handlePatch: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const id = getQueryParam("id", req, res)
  const validatedData = updateChainSchema.parse(req.body)

  const result = await updateChain(id, validatedData, userId)
  if (result.modifiedCount === 0) {
    return res
      .status(404)
      .json({ message: "Chain not found or no changes made" })
  }
  res.status(200).json({ success: true })
}

const handleDelete: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const id = getQueryParam("id", req, res)

  const result = await deleteChain(id, userId)
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Chain not found" })
  }
  res.status(204).end()
}

export default createApiHandler({
  PATCH: handlePatch,
  DELETE: handleDelete,
})
