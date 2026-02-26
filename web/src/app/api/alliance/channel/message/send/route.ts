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

    const { channelId, content } = await req.json();

    if (!channelId || !content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    try {
        const channel = await prisma.allianceChannel.findUnique({
            where: { id: channelId }
        });

        if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

        // Check Permissions
        const membership = await prisma.allianceMember.findUnique({
            where: {
                userId_allianceId: {
                    userId: session.user.id,
                    allianceId: channel.allianceId
                }
            }
        });

        if (!membership) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        // Role Hierarchy Check
        const roles = ["R1", "R2", "R3", "R4", "R5"];
        // @ts-ignore
        const minRoleIndex = roles.indexOf(channel.minRole || "R1");
        const userRoleIndex = roles.indexOf(membership.role);

        if (userRoleIndex < minRoleIndex) {
            return NextResponse.json({ error: `Requires role ${channel.minRole} or higher` }, { status: 403 });
        }

        const message = await prisma.channelMessage.create({
            data: {
                content,
                channelId,
                senderId: session.user.id
            },
            include: {
                sender: { select: { id: true, displayName: true, serverCode: true, image: true } }
            }
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error("Message Send Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
