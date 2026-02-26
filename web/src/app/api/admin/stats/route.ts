import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const totalUsers = await prisma.user.count();
        const totalAlliances = await prisma.alliance.count();
        const activeUsers24h = await prisma.user.count({
            where: { lastActiveAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });

        const recentAlliances = await prisma.alliance.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                createdBy: { select: { displayName: true } }
            }
        });

        return NextResponse.json({
            stats: { totalUsers, totalAlliances, activeUsers24h },
            recentAlliances
        });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
