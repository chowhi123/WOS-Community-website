import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, displayName: true, serverCode: true, globalRole: true } },
                poll: { include: { votes: true } },
                board: { select: { title: true, slug: true, allianceId: true } },
                comments: {
                    include: { author: { select: { displayName: true, serverCode: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

        let isLiked = false;
        if (session?.user?.id) {
            const like = await prisma.postLike.findUnique({
                where: {
                    userId_postId: {
                        userId: session.user.id,
                        postId: id
                    }
                }
            });
            isLiked = !!like;
        }

        return NextResponse.json({ post: { ...post, isLiked } });
    } catch (error) {
        console.error("GET Post Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            select: { authorId: true }
        });

        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        // Check Permissions: Owner OR Admin
        const isOwner = post.authorId === session.user.id;
        const isAdmin = session.user.role === "ADMIN";

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete (Cascade handles comments typically, but being explicit is safe)
        // Prisma schema says: comments Comment[]
        // Comment model has: post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
        // So simple delete is enough.
        await prisma.post.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Post Error", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            select: { authorId: true }
        });

        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        if (post.authorId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { title, content } = await req.json();

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title: title || undefined,
                content: content || undefined,
            }
        });

        return NextResponse.json({ success: true, post: updatedPost });
    } catch (error) {
        console.error("Update Post Error", error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}
