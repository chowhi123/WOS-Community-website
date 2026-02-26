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

    const { serverCode, displayName, image, playerId } = await req.json();

    if (!serverCode || (!displayName && !playerId)) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    try {
        const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });

        // Anti-Spoof: You can only link a Player ID once.
        if (currentUser?.playerId && playerId && currentUser.playerId !== playerId) {
            return NextResponse.json({ error: "Your account is already permanently linked to a Player ID. Please use the Sync API to update your profile." }, { status: 403 });
        }

        const updateData: any = { serverCode, displayName };
        if (image) updateData.image = image;
        if (!currentUser?.playerId && playerId) {
            updateData.playerId = playerId;
            updateData.lastProfileSyncAt = new Date(); // Start the 7-day cooldown clock
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Profile Update Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
