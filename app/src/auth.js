import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const getNativeClientPromise = async () => {
  const mongooseInstance = await dbConnect();
  return mongooseInstance.connection.getClient();
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getNativeClientPromise()),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password.");
        }

        // Ensure database connection is active
        await dbConnect();

        // Find the user by email
        const user = await User.findOne({ email: credentials.email.toLowerCase() }).exec();

        if (!user || !user.password_hash) {
          throw new Error("No user found with this email.");
        }

        // Validate the password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isPasswordValid) {
          throw new Error("Incorrect password.");
        }

        // Return user object for the session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When the user first signs in, 'user' object is available from authorize()
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the token id to session.user so it's accessible globally
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
    }
  }
});
