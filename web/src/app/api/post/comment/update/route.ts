import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId, content } = await req.json();

    if (!commentId || !content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        if (comment.authorId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: { content }
        });

        return NextResponse.json({ success: true, comment: updated });
    } catch (error) {
        console.error("Comment Update Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
