import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (Token Bucket-ish)
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const bucket = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - bucket.lastReset > WINDOW_SIZE) {
        bucket.count = 0;
        bucket.lastReset = now;
    }

    if (bucket.count >= MAX_REQUESTS) {
        return true;
    }

    bucket.count++;
    rateLimitMap.set(ip, bucket);

    if (rateLimitMap.size > 10000) rateLimitMap.clear();

    return false;
}

export default async function proxy(req: NextRequest) {
    // @ts-ignore
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
    const { pathname } = req.nextUrl;

    console.log(`[Middleware] Executing on path: ${pathname}`);

    // Rate Limiting
    if (pathname.startsWith("/api")) {
        if (isRateLimited(ip)) {
            console.warn(JSON.stringify({ type: "RATE_LIMIT_EXCEEDED", ip, path: pathname }));
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }
    }

    // Public / Exempt Routes (Bypass auth entirely)
    const isPublicPath = pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/cron") ||
        pathname === "/auth/signin" ||
        pathname === "/auth/onboarding";

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Attempt to grab token
    const token = await getToken({ req });

    // 1. Unauthenticated User -> Redirect back to sign in
    if (!token) {
        console.log(`[Middleware] BLOCKED - No token for ${pathname}`);
        return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // 2. Admin verification
    if (pathname.startsWith("/admin")) {
        if (token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    // 3. Onboarding restriction
    if (!token.serverCode || !token.displayName) {
        console.log(`[Middleware] BLOCKED - Needs onboarding for ${pathname}`);
        return NextResponse.redirect(new URL("/auth/onboarding", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|logo.png|banner.jpg).*)'],
};
