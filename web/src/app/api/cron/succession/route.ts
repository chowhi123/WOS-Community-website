import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// This endpoint should be secured, e.g., with a CRON_SECRET header
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = req.headers.get("Authorization") || searchParams.get("secret");

    // Simple secret check (In prod, use env var)
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const INACTIVE_DAYS = 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS);

        // 1. Find alliances with inactive R5
        const alliancesWithInactiveR5 = await prisma.alliance.findMany({
            where: {
                members: {
                    some: {
                        role: "R5",
                        user: {
                            lastActiveAt: { lt: cutoffDate }
                        }
                    }
                }
            },
            include: {
                members: {
                    include: { user: { select: { lastActiveAt: true } } }
                }
            }
        });

        const results = [];

        // 2. Process each alliance
        for (const alliance of alliancesWithInactiveR5) {
            const currentR5 = alliance.members.find(m => m.role === "R5");
            if (!currentR5) continue;

            // Find eligible R4s sorted by activity (or join date)
            const eligibleR4 = alliance.members
                .filter(m => m.role === "R4")
                .sort((a, b) => b.user.lastActiveAt.getTime() - a.user.lastActiveAt.getTime())[0];

            if (eligibleR4) {
                // Transaction: Swap roles
                await prisma.$transaction([
                    prisma.allianceMember.update({
                        where: { id: currentR5.id },
                        data: { role: "R4" } // Demote to R4
                    }),
                    prisma.allianceMember.update({
                        where: { id: eligibleR4.id },
                        data: { role: "R5" } // Promote to R5
                    })
                ]);
                results.push(`Swapped Alliance ${alliance.name}: ${currentR5.userId} -> ${eligibleR4.userId}`);
            } else {
                // No R4 available? Try R3? 
                // For now, log warning.
                results.push(`Alliance ${alliance.name}: No R4 to promote.`);
            }
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (error) {
        console.error("Succession Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
