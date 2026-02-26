import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, title, slug, description, availableCategories } = await req.json();

        if (!id || !title || !slug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch current board to get allianceId
        const currentBoard = await prisma.board.findUnique({ where: { id } });
        if (!currentBoard) return NextResponse.json({ error: "Board not found" }, { status: 404 });

        // Check if new slug conflicts (within same scope: Alliance or Global)
        const existing = await prisma.board.findUnique({
            where: {
                board_slug_scope: {
                    slug,
                    allianceId: currentBoard.allianceId as string
                }
            }
        });

        if (existing && existing.id !== id) {
            return NextResponse.json({ error: "Slug already exists in this scope" }, { status: 400 });
        }

        const board = await prisma.board.update({
            where: { id },
            data: {
                title,
                slug,
                description,
                availableCategories: availableCategories || undefined
            }
        });

        return NextResponse.json({ board });

    } catch (error) {
        console.error("Failed to update board:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
