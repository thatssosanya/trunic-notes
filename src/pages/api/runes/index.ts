import { createRuneSchema } from "@/lib/validation/runeSchemas"
import { ApiHandler, createApiHandler } from "@/lib/api/createApiHandler"
import { createRune, getAllRunes } from "@/services/rune"

const handleGet: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const runes = await getAllRunes(userId)
  res.status(200).json(runes)
}

const handlePost: ApiHandler = async (req, res, session) => {
  const userId = session.user.id
  const validatedData = createRuneSchema.parse(req.body)
  const newRune = await createRune(validatedData, userId)
  res.status(201).json(newRune)
}

export default createApiHandler({
  GET: handleGet,
  POST: handlePost,
})
