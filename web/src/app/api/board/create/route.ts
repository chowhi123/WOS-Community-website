import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Only Admin can create global boards
    // Note: R5 will use a different endpoint or param for Guild Boards later
    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, slug, description, availableCategories } = await req.json();

    if (!title || !slug) {
        return NextResponse.json({ error: "Title and Slug required" }, { status: 400 });
    }

    try {
        const board = await prisma.board.create({
            data: {
                title,
                slug,
                description,
                isGlobal: true,
                availableCategories: availableCategories || []
            },
        });

        return NextResponse.json({ success: true, board });
    } catch (error) {
        return NextResponse.json({ error: "Duplicate slug or DB error" }, { status: 500 });
    }
}
