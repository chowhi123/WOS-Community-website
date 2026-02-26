import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const boards = await prisma.board.findMany({
            where: { isGlobal: true },
            orderBy: { title: "asc" },
        });

        return NextResponse.json({ boards });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
