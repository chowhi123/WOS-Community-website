import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverCode, displayName } = await req.json();

    if (!serverCode || !displayName) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                serverCode,
                displayName,
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Onboarding Error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
