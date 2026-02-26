import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reqBody = await req.json();
    const { allianceId, logo, banner, description, name, enableConstructionRes, enableTrainingRes } = reqBody;

    if (!allianceId) {
        return NextResponse.json({ error: "Alliance ID required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        const isAdmin = user?.globalRole === "ADMIN";

        // Check Permissions
        if (!isAdmin) {
            const membership = await prisma.allianceMember.findUnique({
                where: { userId_allianceId: { userId: session.user.id, allianceId } }
            });

            if (!membership || (membership.role !== "R5" && membership.role !== "R4")) {
                return NextResponse.json({ error: "Only R5 or R4 can update alliance settings" }, { status: 403 });
            }
        }

        // Fetch current alliance data to check for old files
        const currentAlliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
        if (!currentAlliance) return NextResponse.json({ error: "Alliance not found" }, { status: 404 });

        // Helper to delete local file
        const deleteLocalFile = (url: string) => {
            if (url && url.startsWith("/uploads/")) {
                const filePath = path.join(process.cwd(), "public", url);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log("Deleted old file:", filePath);
                    } catch (err) {
                        console.error("Failed to delete file:", filePath, err);
                    }
                }
            }
        };

        // Check Logo Change
        if (logo !== undefined && currentAlliance.logo !== logo) {
            if (currentAlliance.logo) deleteLocalFile(currentAlliance.logo);
        }

        // Check Banner Change
        if (banner !== undefined && currentAlliance.banner !== banner) {
            if (currentAlliance.banner) deleteLocalFile(currentAlliance.banner);
        }

        const updated = await prisma.alliance.update({
            where: { id: allianceId },
            data: {
                logo: logo !== undefined ? logo : undefined,
                logoPos: reqBody.logoPos !== undefined ? reqBody.logoPos : undefined,
                banner: banner !== undefined ? banner : undefined,
                bannerPos: reqBody.bannerPos !== undefined ? reqBody.bannerPos : undefined,
                description: description !== undefined ? description : undefined,
                name: name !== undefined ? name : undefined,
                enableConstructionRes: enableConstructionRes !== undefined ? enableConstructionRes : undefined,
                enableTrainingRes: enableTrainingRes !== undefined ? enableTrainingRes : undefined,
            }
        });

        return NextResponse.json({ success: true, alliance: updated });
    } catch (error) {
        console.error("Alliance Update Error", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
