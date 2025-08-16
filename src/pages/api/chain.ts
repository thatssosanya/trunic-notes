import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { Chain } from "@/types"
import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth/options"

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
  const chainsCollection = db.collection("chains")

  switch (req.method) {
    case "GET":
      const chains = await chainsCollection.find({ userId }).toArray()
      const chainsWithStringId = chains.map((chain) => {
        const { _id, ...rest } = chain
        return {
          ...rest,
          id: _id.toString(),
        }
      })
      res.status(200).json(chainsWithStringId)
      break

    case "POST":
      // TODO handle sequence
      const newChainData: Omit<Chain, "id" | "userId"> = req.body
      const result = await chainsCollection.insertOne({
        ...newChainData,
        userId,
      })
      res.status(201).json({ success: true, insertedId: result.insertedId })
      break

    case "PUT":
      const { id: updateId, ...updateData }: Partial<Chain> = req.body
      if (!updateId)
        return res.status(400).json({ error: "Chain ID required for update." })
      await chainsCollection.updateOne(
        { _id: new ObjectId(updateId), userId },
        { $set: updateData }
      )
      res.status(200).json({ success: true })
      break

    case "DELETE":
      const { id: deleteId } = req.query
      if (typeof deleteId !== "string")
        return res.status(400).json({ error: "ID is required" })
      await chainsCollection.deleteOne({ _id: new ObjectId(deleteId), userId })
      res.status(200).json({ success: true })
      break

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
