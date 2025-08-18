import { updateRuneSchema } from "@/lib/validation/runeSchemas"
import { ApiHandler, createApiHandler } from "@/lib/api/createApiHandler"
import { deleteRune, updateRune } from "@/services/rune"
import { getQueryParam } from "@/lib/api/utils"

const handlePatch: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const id = getQueryParam("id", req, res)
  const validatedData = updateRuneSchema.parse(req.body)

  const result = await updateRune(id, validatedData, userId)
  if (result.modifiedCount === 0) {
    return res
      .status(404)
      .json({ message: "Rune not found or no changes made" })
  }
  res.status(200).json({ success: true })
}

const handleDelete: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const id = getQueryParam("id", req, res)

  const result = await deleteRune(id, userId)
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Rune not found" })
  }
  res.status(204).end()
}

export default createApiHandler({
  PATCH: handlePatch,
  DELETE: handleDelete,
})
