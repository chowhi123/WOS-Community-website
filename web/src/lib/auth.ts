import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = user.globalRole;
                // @ts-ignore
                token.serverCode = user.serverCode;
                // @ts-ignore
                token.displayName = user.displayName;
            }

            // Client-side update() call
            if (trigger === "update" && session) {
                if (session.serverCode) token.serverCode = session.serverCode;
                if (session.displayName) token.displayName = session.displayName;
                if (session.image) token.picture = session.image; // Explicitly map image payload to standard JWT picture
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token?.sub) {
                // Add ID and Role to session
                session.user.id = token.sub;

                const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
                if (dbUser) {
                    session.user.role = dbUser.globalRole; // Keep for backward compatibility if any
                    session.user.globalRole = dbUser.globalRole;
                    session.user.serverCode = dbUser.serverCode;
                    session.user.displayName = dbUser.displayName;
                    session.user.isApprovedLeader = dbUser.isApprovedLeader;

                    // First User Logic (Lazy Check)
                    const count = await prisma.user.count();
                    if (count === 1 && dbUser.globalRole === 'USER') {
                        await prisma.user.update({
                            where: { id: dbUser.id },
                            data: { globalRole: 'ADMIN' },
                        });
                        session.user.role = 'ADMIN';
                        session.user.globalRole = 'ADMIN';
                    }

                    // Explicitly mount the avatar image from the token or database string
                    if (dbUser.image || token.picture) {
                        session.user.image = dbUser.image || token.picture;
                    }
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};

// Types augmentation moved to src/types/next-auth.d.ts
