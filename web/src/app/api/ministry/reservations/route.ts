import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List Reservations (Filter by date optionally)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // ISO String or YYYY-MM-DD
    const allianceId = searchParams.get("allianceId");

    // TODO: Ideally filter by alliance if strictly for one alliance. 
    // For now, assuming Global or filtered by User's alliance if needed.

    try {
        const reservations = await prisma.ministryReservation.findMany({
            where: {
                // If date is provided, filter by specific range
                ...(date ? {
                    startTime: {
                        gte: new Date(date), // Start of day
                        lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) // End of day
                    }
                } : {})
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        displayName: true,
                        memberships: {
                            include: { alliance: true }
                        }
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return NextResponse.json({ reservations });
    } catch (error) {
        console.error("Ministry List Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Create Reservation Request
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { position, startTime, endTime, resourceData } = body;

        // Basic validation
        if (!position || !startTime || !endTime || !resourceData) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const reservation = await prisma.ministryReservation.create({
            data: {
                position,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                resourceData, // JSON
                userId: session.user.id,
                status: "PENDING"
            }
        });

        return NextResponse.json({ reservation });
    } catch (error) {
        console.error("Ministry Create Error:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
