import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    const { id } = await params;

    try {
        const alliance = await prisma.alliance.findUnique({
            where: { id },
            include: {
                _count: { select: { members: true } },
                channels: { select: { id: true, name: true, type: true, minRole: true, minReadRole: true } },
                boards: { select: { id: true, title: true, slug: true } },
            }
        });

        if (!alliance) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        let membership = null;
        let members: any[] = [];

        let isAdmin = false;

        if (session?.user?.id) {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            isAdmin = user?.globalRole === "ADMIN";

            membership = await prisma.allianceMember.findUnique({
                where: {
                    userId_allianceId: {
                        userId: session.user.id,
                        allianceId: id
                    }
                }
            });

            // If user is a member OR Is Admin, fetch the member list
            if (membership || isAdmin) {
                members = await prisma.allianceMember.findMany({
                    where: { allianceId: id },
                    include: {
                        user: {
                            select: {
                                id: true,
                                displayName: true,
                                serverCode: true,
                            }
                        }
                    },
                    orderBy: { role: 'asc' } // R5 first
                });
            }
        }

        if (!membership && !isAdmin) {
            return NextResponse.json({ error: "Access Denied. You are not a member of this alliance." }, { status: 403 });
        }

        // Filter Channels based on Role
        if (alliance.channels) {
            const roleMap: Record<string, number> = { "R1": 1, "R2": 2, "R3": 3, "R4": 4, "R5": 5 };
            // @ts-ignore
            const userRoleRank = isAdmin ? 99 : (membership ? roleMap[membership.role || "R1"] : 0);

            // @ts-ignore
            alliance.channels = alliance.channels.filter((c: any) => {
                const minRead = c.minReadRole || "R1";
                const requiredRank = roleMap[minRead] || 1;
                return userRoleRank >= requiredRank;
            });
        }

        return NextResponse.json({ alliance, membership, members });
    } catch (error) {
        console.error("Alliance Detail API Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
