import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Check for Admin OR Approved Leader status
    // Note: session type needs 'isApprovedLeader'
    const user = session?.user as any;
    if (!session || (user?.role !== "ADMIN" && !user?.isApprovedLeader)) {
        return NextResponse.json({ error: "Unauthorized. Requires Admin or R5 Permission." }, { status: 403 });
    }

    const { name, description, leaderId } = await req.json();

    if (!name || !leaderId) {
        return NextResponse.json({ error: "Name and Leader ID are required" }, { status: 400 });
    }

    try {
        const alliance = await prisma.alliance.create({
            data: {
                name,
                description,
                createdById: session.user.id,
                members: {
                    create: {
                        userId: leaderId,
                        role: "R5", // Leader
                    },
                },
                channels: {
                    create: [
                        { name: "general", type: "TEXT" },
                        { name: "officers", type: "TEXT" }
                    ]
                },
                // Auto-create Notice Board
                boards: {
                    create: {
                        title: "공지사항",
                        slug: `${name.replace(/\s+/g, '-').toLowerCase()}-notice-${Date.now()}`, // Unique slug
                        description: "Alliance Official Notices",
                        isGlobal: false,
                        category: "NOTICE",
                        availableCategories: ["NOTICE"]
                    }
                }
            },
        });

        return NextResponse.json({ success: true, alliance });
    } catch (error) {
        console.error("Alliance Create Error:", error);
        return NextResponse.json({ error: "Database error or Name duplicate" }, { status: 500 });
    }
}
