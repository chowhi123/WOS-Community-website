import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Strict Admin Check
    if (!session || (session.user as any)?.role !== "ADMIN") {
        // Double check separate user table logic if needed, but session role is usually faster
        // Usually we trust session, but for sensitive admin actions we might want to re-verify against DB
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'active'; // 'active' | 'alpha'

    try {
        let orderBy: any = { lastPostAt: 'desc' }; // Default: Latest Activity

        if (sortBy === 'alpha') {
            orderBy = { name: 'asc' };
        } else if (sortBy === 'active') {
            orderBy = { lastPostAt: 'desc' };
            // Use createdAt as secondary?
        }

        const alliances = await prisma.alliance.findMany({
            orderBy: orderBy,
            include: {
                createdBy: { select: { displayName: true } },
                _count: { select: { members: true } }
            }
        });

        return NextResponse.json({ alliances });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
