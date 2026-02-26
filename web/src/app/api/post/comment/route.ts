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

    const { postId, content, parentId } = await req.json();

    if (!postId || !content) {
        return NextResponse.json({ error: "Post ID and Content required" }, { status: 400 });
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                postId,
                content,
                authorId: session.user.id,
                parentId: parentId || null
            },
            include: { post: { select: { authorId: true, title: true } } }
        });

        // 1. Notify Post Author
        if (comment.post.authorId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: comment.post.authorId,
                    type: "COMMENT",
                    message: `${session.user.name || "Someone"} commented on your post "${comment.post.title}"`,
                    link: `/posts/${postId}`
                }
            });
        }

        // 2. Notify Mentions
        const { extractMentions } = require("@/lib/mentions"); // Dynamic import to avoid build issues if file not ready
        const mentionedNames = extractMentions(content);

        if (mentionedNames.length > 0) {
            const mentionedUsers = await prisma.user.findMany({
                where: { displayName: { in: mentionedNames } },
                select: { id: true, displayName: true }
            });

            for (const user of mentionedUsers) {
                if (user.id !== session.user.id) { // Don't notify self
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: "MENTION",
                            message: `${session.user.name || "Someone"} mentioned you in a comment`,
                            link: `/posts/${postId}`
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true, comment });
    } catch (error) {
        return NextResponse.json({ error: "Comment Failed" }, { status: 500 });
    }
}
