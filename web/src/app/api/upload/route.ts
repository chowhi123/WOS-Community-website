import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file received" }, { status: 400 });
        }

        // 1. Validation
        // Size Limit: 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (Max 5MB)" }, { status: 400 });
        }

        // Type Limit
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
        }

        // 2. Prepare Directory
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure storage/uploads exists (Private Directory)
        const uploadDir = join(process.cwd(), "storage/uploads");
        await mkdir(uploadDir, { recursive: true });

        // 3. Generate Filename (timestamp + random)
        const ext = path.extname(file.name) || ".png";
        const filename = `${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;
        const filepath = join(uploadDir, filename);

        // 4. Save File
        await writeFile(filepath, buffer);

        // 5. Return Protected URL
        const url = `/api/file/${filename}`;
        return NextResponse.json({ url });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
