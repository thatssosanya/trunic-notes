import clientPromise from "@/lib/mongodb"
import { DbChain, Chain } from "@/types"
import { Collection, ObjectId } from "mongodb"
import { z } from "zod"
import {
  createChainSchema,
  updateChainSchema,
} from "@/lib/validation/chainSchemas"

async function getChainsCollection(): Promise<Collection<Omit<DbChain, "id">>> {
  const client = await clientPromise
  return client.db().collection("chains")
}

function mapDbChainToChain(
  dbChain: Omit<DbChain, "id"> & { _id: ObjectId }
): Chain {
  const { _id, ...rest } = dbChain
  return { ...rest, id: _id.toString() }
}

export async function getAllChains(userId: string): Promise<Chain[]> {
  const collection = await getChainsCollection()
  const dbChains = await collection
    .find({ userId })
    .sort({ sequence: 1 })
    .toArray()
  return dbChains.map(mapDbChainToChain)
}

export async function createChain(
  data: z.infer<typeof createChainSchema>,
  userId: string
): Promise<Chain> {
  const collection = await getChainsCollection()

  const lastChain = await collection
    .find({ userId })
    .sort({ sequence: -1 })
    .limit(1)
    .toArray()

  const newSequence =
    lastChain.length > 0 ? (lastChain[0].sequence || 0) + 1 : 0

  const safeData = {
    ...data,
    translation: data.translation || "",
    note: data.note || "",
  }

  const result = await collection.insertOne({
    ...safeData,
    userId,
    sequence: newSequence,
  })

  return {
    ...safeData,
    sequence: newSequence,
    id: result.insertedId.toString(),
  }
}

export async function updateChain(
  chainId: string,
  data: z.infer<typeof updateChainSchema>,
  userId: string
): Promise<{ modifiedCount: number }> {
  const collection = await getChainsCollection()
  const result = await collection.updateOne(
    { _id: new ObjectId(chainId), userId },
    { $set: data }
  )
  return { modifiedCount: result.modifiedCount }
}

export async function deleteChain(
  chainId: string,
  userId: string
): Promise<{ deletedCount: number }> {
  const collection = await getChainsCollection()
  const result = await collection.deleteOne({
    _id: new ObjectId(chainId),
    userId,
  })
  return { deletedCount: result.deletedCount }
}
