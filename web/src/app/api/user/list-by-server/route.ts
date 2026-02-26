import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const serverCode = searchParams.get("serverCode");

    if (!serverCode) {
        return NextResponse.json({ error: "Missing server code" }, { status: 400 });
    }

    try {
        const users = await prisma.user.findMany({
            where: { isActive: true, serverCode: serverCode },
            select: { id: true, displayName: true, image: true },
            orderBy: { displayName: 'asc' }
        });

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
