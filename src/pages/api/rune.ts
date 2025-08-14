import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { Rune } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Not authenticated" })
  }
  const userId = session.user.id

  const client = await clientPromise
  const db = client.db()
  const runesCollection = db.collection<Omit<Rune, "id">>("runes")

  switch (req.method) {
    case "GET":
      try {
        const runes = await runesCollection
          .find({ userId })
          .sort({ sequence: 1 })
          .toArray()
        const runesWithStringId = runes.map((rune) => {
          const { _id, ...rest } = rune
          return {
            ...rest,
            id: _id.toString(),
          }
        })
        res.status(200).json(runesWithStringId)
      } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Failed to fetch runes" })
      }
      break

    case "PUT": // handles reordering
      try {
        const { orderedIds }: { orderedIds: string[] } = req.body
        if (!orderedIds || !Array.isArray(orderedIds)) {
          return res
            .status(400)
            .json({ error: "orderedIds array is required." })
        }

        const operations = orderedIds.map((id, index) => ({
          updateOne: {
            filter: { _id: new ObjectId(id), userId },
            update: { $set: { sequence: index } },
          },
        }))

        if (operations.length === 0) {
          return res
            .status(200)
            .json({ success: true, message: "No items to reorder." })
        }

        const result = await runesCollection.bulkWrite(operations)
        res.status(200).json({ success: true, result })
      } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Failed to reorder runes." })
      }
      break

    case "POST": // handles content updates
      try {
        const { id, ...data }: Omit<Rune, "id"> & { id?: string } = req.body
        let result

        if (id) {
          result = await runesCollection.updateOne(
            { _id: new ObjectId(id), userId },
            { $set: data }
          )
        } else {
          const lastRune = await runesCollection
            .find({ userId })
            .sort({ sequence: -1 })
            .limit(1)
            .toArray()
          const newSequence =
            lastRune.length > 0 ? (lastRune[0].sequence || 0) + 1 : 0

          result = await runesCollection.insertOne({
            ...data,
            userId,
            sequence: newSequence,
          })
        }
        res.status(200).json({ success: true, result })
      } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Failed to save rune" })
      }
      break

    case "DELETE":
      try {
        const { id } = req.query

        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "Rune ID is required" })
        }

        const result = await db
          .collection("runes")
          .deleteOne({ _id: new ObjectId(id), userId })

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Rune not found" })
        }

        res.status(200).json({ success: true, message: "Rune deleted" })
      } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Failed to delete rune" })
      }
      break

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
