import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, subscribe } = await req.json(); // subscribe: true/false

    if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });

    try {
        if (subscribe) {
            await prisma.eventSubscription.create({
                data: {
                    userId: session.user.id,
                    eventId
                }
            });
        } else {
            await prisma.eventSubscription.delete({
                where: {
                    userId_eventId: {
                        userId: session.user.id,
                        eventId
                    }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        // Ignore duplicate create or missing delete
        return NextResponse.json({ success: true });
    }
}
