import clientPromise from "@/lib/mongodb"
import { DbRune, Rune } from "@/types"
import { Collection, ObjectId } from "mongodb"
import { z } from "zod"
import {
  createRuneSchema,
  updateRuneSchema,
} from "@/lib/validation/runeSchemas"

async function getRunesCollection(): Promise<Collection<Omit<DbRune, "id">>> {
  const client = await clientPromise
  return client.db().collection("runes")
}

function mapDbRuneToRune(dbRune: Omit<DbRune, "id"> & { _id: ObjectId }): Rune {
  const { _id, ...rest } = dbRune
  return { ...rest, id: _id.toString() }
}

export async function getAllRunes(userId: string): Promise<Rune[]> {
  const collection = await getRunesCollection()
  const dbRunes = await collection
    .find({ userId })
    .sort({ sequence: 1 })
    .toArray()
  return dbRunes.map(mapDbRuneToRune)
}

export async function createRune(
  data: z.infer<typeof createRuneSchema>,
  userId: string
): Promise<Rune> {
  const collection = await getRunesCollection()

  const client = await clientPromise
  const session = client.startSession()

  let newRune: Rune

  try {
    await session.withTransaction(async () => {
      const lastRune = await collection
        .find({ userId }, { session })
        .sort({ sequence: -1 })
        .limit(1)
        .toArray()

      const newSequence =
        lastRune.length > 0 ? (lastRune[0].sequence || 0) + 1 : 0

      const safeData = {
        ...data,
        sequence: newSequence,
        translation: data.translation || "",
        note: data.note || "",
        isConfident: data.isConfident || false,
      }

      const result = await collection.insertOne(
        {
          ...safeData,
          userId,
        },
        { session }
      )

      newRune = {
        ...safeData,
        sequence: newSequence,
        id: result.insertedId.toString(),
      }
    })
  } finally {
    await session.endSession()
  }

  return newRune!
}

export async function updateRune(
  id: string,
  data: z.infer<typeof updateRuneSchema>,
  userId: string
): Promise<{ modifiedCount: number }> {
  const collection = await getRunesCollection()
  const result = await collection.updateOne(
    { _id: new ObjectId(id), userId },
    { $set: data }
  )
  return { modifiedCount: result.modifiedCount }
}

export async function deleteRune(
  id: string,
  userId: string
): Promise<{ deletedCount: number }> {
  const collection = await getRunesCollection()
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    userId,
  })
  return { deletedCount: result.deletedCount }
}

export async function reorderRunes(
  orderedIds: string[],
  userId: string
): Promise<{ modifiedCount: number }> {
  const collection = await getRunesCollection()

  if (orderedIds.length === 0) {
    return { modifiedCount: 0 }
  }

  const operations = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(id), userId },
      update: { $set: { sequence: index } },
    },
  }))

  const result = await collection.bulkWrite(operations)
  return { modifiedCount: result.modifiedCount || 0 }
}
