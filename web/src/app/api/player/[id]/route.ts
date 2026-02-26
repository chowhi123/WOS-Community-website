import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const API_SECRET = 'tB87#kPtkxqOS2';
const API_URL = 'https://wos-giftcode-api.centurygame.com/api/player';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id || id.trim() === "") {
        return NextResponse.json({ error: "Missing player ID" }, { status: 400 });
    }

    try {
        const currentTime = Date.now();
        const formArgs = `fid=${id}&time=${currentTime}`;
        const sign = crypto.createHash('md5').update(formArgs + API_SECRET).digest('hex');
        const bodyPayload = `sign=${sign}&${formArgs}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://wos-giftcode.centurygame.com'
            },
            body: bodyPayload
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch from Century Games API" }, { status: response.status });
        }

        const data = await response.json();

        // Check if player doesn't exist according to Century Game's custom error shapes
        if (data.err_code === 40001 || data.msg === 'ROLE NOT EXIST' || data.msg === 'ROLE NOT EXIST.') {
            return NextResponse.json({ error: "Player not found", code: 404 }, { status: 404 });
        }

        if (data.code === 0 && data.data) {
            return NextResponse.json({ player: data.data });
        }

        return NextResponse.json({ error: data.msg || "Unknown error from game API", code: data.code }, { status: 400 });

    } catch (error: any) {
        console.error("WOS API Proxy Error:", error);
        return NextResponse.json({ error: "Internal server error fetching player data" }, { status: 500 });
    }
}
