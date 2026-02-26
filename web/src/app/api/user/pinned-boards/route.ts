import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

// GET: List pinned boards for current user
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ pinnedBoards: [] });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                pinnedBoards: {
                    select: { id: true, title: true, slug: true, allianceId: true }
                }
            }
        });

        return NextResponse.json({ pinnedBoards: user?.pinnedBoards || [] });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Toggle Pin (Add/Remove)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { boardId, isPinned } = await req.json();

        if (isPinned) {
            // Add to pinned
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    pinnedBoards: {
                        connect: { id: boardId }
                    }
                }
            });
        } else {
            // Remove from pinned
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    pinnedBoards: {
                        disconnect: { id: boardId }
                    }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Pin Error", error);
        return NextResponse.json({ error: "Failed to update pin" }, { status: 500 });
    }
}
