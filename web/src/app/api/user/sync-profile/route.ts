import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import crypto from "crypto";

const prisma = new PrismaClient();

const API_SECRET = 'tB87#kPtkxqOS2';
const API_URL = 'https://wos-giftcode-api.centurygame.com/api/player';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { playerId: true, lastProfileSyncAt: true }
        });

        if (!user || !user.playerId) {
            return NextResponse.json({ error: "No Player ID linked to your account." }, { status: 400 });
        }

        // Enforce 7-Day Cooldown
        const now = new Date();
        if (user.lastProfileSyncAt) {
            const timeSinceSync = now.getTime() - user.lastProfileSyncAt.getTime();
            if (timeSinceSync < SEVEN_DAYS_MS) {
                const timeRemaining = SEVEN_DAYS_MS - timeSinceSync;
                const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
                return NextResponse.json(
                    { error: `You can only sync once every 7 days. Try again in ${daysRemaining} day(s).` },
                    { status: 429 }
                );
            }
        }

        // Fetch new data from Century Games
        const currentTime = Date.now();
        const formArgs = `fid=${user.playerId}&time=${currentTime}`;
        const sign = crypto.createHash('md5').update(formArgs + API_SECRET).digest('hex');
        const bodyPayload = `sign=${sign}&${formArgs}`;

        const cgRes = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://wos-giftcode.centurygame.com'
            },
            body: bodyPayload
        });

        if (!cgRes.ok) throw new Error("Century Games API unavailable");

        const data = await cgRes.json();

        if (data.code !== 0 || !data.data) {
            return NextResponse.json({ error: data.msg || "Failed to parse Century Games data" }, { status: 400 });
        }

        // Apply new profile values to database
        const serverCode = `#${data.data.kid}`;
        const displayName = data.data.nickname;
        const image = data.data.avatar_image;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                serverCode,
                displayName,
                image,
                lastProfileSyncAt: now
            }
        });

        return NextResponse.json({
            success: true,
            user: { serverCode, displayName, image }
        });

    } catch (error) {
        console.error("Weekly Profile Sync Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
