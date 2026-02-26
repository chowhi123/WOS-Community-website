import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Strictly Admin Only
    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                posts: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { title: true, createdAt: true }
                },
                comments: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { content: true, createdAt: true }
                },
                _count: {
                    select: {
                        posts: true,
                        comments: true
                    }
                }
            }
        });

        // Transform for UI
        const safetiedUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            displayName: u.displayName,
            serverCode: u.serverCode,
            // @ts-ignore
            isApprovedLeader: u.isApprovedLeader,
            // @ts-ignore
            isActive: u.isActive,
            role: u.globalRole,
            lastLogin: u.lastActiveAt,
            joinedAt: u.createdAt,
            lastPost: u.posts[0] || null,
            lastComment: u.comments[0] || null,
            stats: {
                posts: u._count.posts,
                comments: u._count.comments
            }
        }));

        return NextResponse.json({ users: safetiedUsers });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
