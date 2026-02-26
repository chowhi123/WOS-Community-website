import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";

export async function GET(req: Request) {
    // Basic securing of the cron endpoint using a shared secret in env
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "development-cron-secret";

    // Allow if in dev or if the Authorization header matches Bearer {CRON_SECRET}
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const now = new Date();
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

        // Find events starting in the next 15 minutes that haven't sent a reminder
        const upcomingEvents = await prisma.event.findMany({
            where: {
                startTime: {
                    gte: now,
                    lte: fifteenMinutesFromNow
                },
                reminderSent: false
            },
            include: {
                alliance: {
                    select: { name: true }
                },
                subscriptions: {
                    select: { userId: true }
                }
            }
        });

        console.log(`[CRON] Found ${upcomingEvents.length} events needing reminders.`);

        const notificationsSent: string[] = [];

        for (const event of upcomingEvents) {
            const userIds = event.subscriptions.map((sub: any) => sub.userId);

            if (userIds.length > 0) {
                // Send push notification to all subscribed users
                const pushPromises = userIds.map((userId: string) => {
                    return sendPushNotification(userId, {
                        title: "Alliance Event Starting Soon! ⚔️",
                        message: `${event.title} in ${event.alliance.name} starts in less than 15 minutes!`,
                        url: `/alliances/${event.allianceId}`
                    });
                });

                await Promise.all(pushPromises);
                notificationsSent.push(`Event: ${event.title}, Sent: ${userIds.length}`);
            }

            // Mark as sent
            await prisma.event.update({
                where: { id: event.id },
                data: { reminderSent: true }
            });
        }

        return NextResponse.json({
            success: true,
            eventsProcessed: upcomingEvents.length,
            notificationsSent
        });

    } catch (error) {
        console.error("[CRON ERROR] Event Reminders:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
