import { reorderRunesSchema } from "@/lib/validation/runeSchemas"
import { ApiHandler, createApiHandler } from "@/lib/api/createApiHandler"
import { reorderRunes } from "@/services/rune"

const handlePut: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const { orderedIds } = reorderRunesSchema.parse(req.body)
  const result = await reorderRunes(orderedIds, userId)
  res.status(200).json({ success: true, modifiedCount: result.modifiedCount })
}

export default createApiHandler({
  PUT: handlePut,
})
