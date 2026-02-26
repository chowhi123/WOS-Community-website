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

    const { pollId, optionIndex } = await req.json();

    if (!pollId || optionIndex === undefined) {
        return NextResponse.json({ error: "Poll ID and Option Index required" }, { status: 400 });
    }

    try {
        // Check if user already voted
        const existingVote = await prisma.pollVote.findFirst({
            where: { pollId, userId: session.user.id }
        });

        if (existingVote) {
            return NextResponse.json({ error: "Already voted" }, { status: 400 });
        }

        const vote = await prisma.pollVote.create({
            data: {
                pollId,
                userId: session.user.id,
                optionIndex
            },
        });

        return NextResponse.json({ success: true, vote });
    } catch (error) {
        return NextResponse.json({ error: "Vote Failed" }, { status: 500 });
    }
}
