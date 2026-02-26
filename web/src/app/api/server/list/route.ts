import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: { isActive: true, serverCode: { not: null } },
            select: { serverCode: true },
            distinct: ['serverCode']
        });

        const servers = users.map(u => u.serverCode).filter(Boolean).sort();

        return NextResponse.json({ servers });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
