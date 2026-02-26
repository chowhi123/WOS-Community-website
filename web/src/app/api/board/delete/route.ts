import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    // Only Admin
    if (!session || session.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Board ID required" }, { status: 400 });
        }

        // Transactional Delete: Posts first, then Board
        await prisma.$transaction([
            prisma.post.deleteMany({
                where: { boardId: id }
            }),
            prisma.board.delete({
                where: { id }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete board error:", error);
        return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
    }
}
