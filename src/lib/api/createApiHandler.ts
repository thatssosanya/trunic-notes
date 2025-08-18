import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession, Session } from "next-auth"
import authOptions from "@/lib/auth/options"
import { MongoServerError } from "mongodb"
import { ZodError } from "zod"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface HandlerOptions {
  auth: boolean
}

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) => Promise<void>

export function createApiHandler(
  handler: Partial<Record<HttpMethod, ApiHandler>>,
  options: HandlerOptions = { auth: true }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      let session: Session | null = null
      if (options.auth) {
        session = await getServerSession(req, res, authOptions)
        if (!session || !session?.user?.id) {
          return res.status(401).json({ message: "Not authenticated" })
        }
      }

      const method = req.method as HttpMethod
      const methodHandler = handler[method]
      if (!methodHandler) {
        const allowedMethods = Object.keys(handler).join(", ")
        res.setHeader("Allow", allowedMethods)
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` })
      }

      await methodHandler(req, res, session!)
    } catch (error) {
      console.error(error)

      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.flatten().fieldErrors,
        })
      }

      if (error instanceof MongoServerError) {
        // Handle specific DB errors if needed
        return res.status(500).json({ message: "Database error" })
      }

      return res.status(500).json({ message: "Internal Server Error" })
    }
  }
}
