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

    const { postId } = await req.json();

    try {
        // Toggle Logic
        const existingLike = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId: session.user.id,
                    postId
                }
            }
        });

        let updatedPost;
        let isLiked = false;

        if (existingLike) {
            // Unlike
            await prisma.postLike.delete({
                where: { id: existingLike.id }
            });
            updatedPost = await prisma.post.update({
                where: { id: postId },
                data: { likeCount: { decrement: 1 } }
            });
            isLiked = false;
        } else {
            // Like
            await prisma.postLike.create({
                data: {
                    userId: session.user.id,
                    postId
                }
            });
            updatedPost = await prisma.post.update({
                where: { id: postId },
                data: { likeCount: { increment: 1 } }
            });
            isLiked = true;
        }

        return NextResponse.json({ success: true, likes: updatedPost.likeCount, liked: isLiked });
    } catch (error) {
        console.error("Like Error", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}
