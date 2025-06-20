import NextAuth from 'next-auth';
import type { NextAuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Extend the types for better TypeScript support
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      companyId?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string | null;
    companyId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  // Add a secret key for JWT encryption
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-should-be-at-least-32-chars',
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When signing in, copy user data to the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties from the token to the client
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role || null;
        session.user.companyId = token.companyId || null;
      }
      return session;
    },
  },
  // Enable session persistence across browser sessions
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Enable secure cookies in production
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };