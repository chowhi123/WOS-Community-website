import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
// import mime from "mime"; // Removed missing dependency

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
    const session = await getServerSession(authOptions);

    // 1. Auth Check: Must be logged in
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    if (!filename) return NextResponse.json({ error: "Invalid filename" }, { status: 400 });

    // 2. Path Traversal Check
    // e.g. ".." should not be allowed
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = join(process.cwd(), "storage/uploads", filename);

    if (!existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
        const fileBuffer = await readFile(filePath);

        // Determine mime type
        const ext = filename.split('.').pop()?.toLowerCase();
        let contentType = "application/octet-stream";
        const mimeMap: Record<string, string> = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "webp": "image/webp",
            "svg": "image/svg+xml",
            "pdf": "application/pdf"
        };
        if (ext && mimeMap[ext]) {
            contentType = mimeMap[ext];
        }

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=3600" // Browser can cache, but private
            }
        });
    } catch (error) {
        console.error("File Read Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
