import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET: Fetch User Profile
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                memberships: {
                    include: {
                        alliance: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Sanitize return
        return NextResponse.json({
            user: {
                name: user.name,
                email: user.email,
                image: user.image,
                displayName: user.displayName,
                serverCode: user.serverCode,
                playerId: user.playerId,
                lastProfileSyncAt: user.lastProfileSyncAt,
                memberships: user.memberships.map(m => ({
                    role: m.role,
                    alliance: m.alliance
                }))
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

