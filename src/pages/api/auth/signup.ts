import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { UserData } from "@/types"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { name, password } = req.body

    if (!name || !password || password.length < 6) {
      return res.status(400).json({
        message:
          "Invalid input - password should be at least 6 characters long.",
      })
    }

    const client = await clientPromise
    const db = client.db()

    const existingUser = await db
      .collection<UserData>("users")
      .findOne({ name })

    if (existingUser) {
      return res.status(422).json({ message: "User exists already!" })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.collection("users").insertOne({
      name: name,
      password: hashedPassword,
    })

    res.status(201).json({ message: "Created user!" })
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong.", error: JSON.stringify(error) })
  }
}
