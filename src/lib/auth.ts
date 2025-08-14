import { UserData } from "@/types"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error("No credentials provided.")
        }

        const client = await clientPromise
        const usersCollection = client.db().collection<UserData>("users")

        const user = await usersCollection.findOne({ name: credentials.name })

        if (!user) {
          throw new Error("No user found!")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password as string
        )

        if (!isValid) {
          throw new Error("Could not log you in!")
        }

        return { id: user._id.toString(), name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
}
