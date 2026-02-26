import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Initialize VAPID
// We assume these are set. If not, catching error logic is needed.
try {
    webpush.setVapidDetails(
        "mailto:admin@wos-community.com",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
        process.env.VAPID_PRIVATE_KEY || ""
    );
} catch (e) {
    console.warn("VAPID keys not set properly.");
}

interface PushPayload {
    title: string;
    message: string;
    url?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
    // 1. Get subscriptions for user
    const subs = await prisma.pushSubscription.findMany({
        where: { userId }
    });

    if (subs.length === 0) return;

    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.auth,
                        p256dh: sub.p256dh
                    }
                },
                JSON.stringify(payload)
            );
        } catch (error: unknown) {
            // web-push errors typically have a statusCode
            const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error as { statusCode: number }).statusCode : null;

            if (statusCode === 410 || statusCode === 404) {
                // Subscription expired/gone, delete it
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
            } else {
                console.error("Push Error:", error);
            }
        }
    });

    await Promise.all(promises);
}
