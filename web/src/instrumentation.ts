export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Prevent double execution in dev mode (hot reload)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((global as any).__SCHEDULER_STARTED__) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).__SCHEDULER_STARTED__ = true;

        console.log("⏰ Event Notification Scheduler Started");

        // Dynamic import to avoid build-time issues if any
        const { prisma } = await import("@/lib/prisma");
        const { sendPushNotification } = await import("@/lib/push");

        // Run every minute
        setInterval(async () => {
            try {
                const now = new Date();
                const nowTime = now.getTime();

                // Define windows (in ms)
                // 5 minutes before: [now + 5m, now + 5m + 59s]
                // We want to catch events starting roughly X minutes from now.
                // Since we run every minute, checking a 1-minute window is safe.

                const minutesToCheck = [1, 2, 5];

                for (const min of minutesToCheck) {
                    const targetStart = new Date(nowTime + min * 60 * 1000);
                    const targetEnd = new Date(nowTime + min * 60 * 1000 + 59 * 1000); // 1 minute window

                    const events = await prisma.event.findMany({
                        where: {
                            startTime: {
                                gte: targetStart,
                                lt: targetEnd
                            }
                        },
                        include: {
                            subscriptions: true, // Get users who subscribed
                            alliance: { select: { name: true } }
                        }
                    });

                    for (const event of events) {
                        const timeLabel = `${min} minute${min > 1 ? 's' : ''}`;

                        for (const sub of event.subscriptions) {
                            try {
                                await sendPushNotification(sub.userId, {
                                    title: `📢 ${event.title} starting in ${timeLabel}!`,
                                    message: `Event in ${event.alliance.name} is starting soon. Get ready!`,
                                    url: `/alliances/${event.allianceId}`
                                });
                            } catch (e) {
                                console.error(`Failed to notify user ${sub.userId}`, e);
                            }
                        }
                    }
                }

                // --- Reservation Checks (5 minutes only) ---
                const resTargetStart = new Date(nowTime + 5 * 60 * 1000);
                const resTargetEnd = new Date(nowTime + 5 * 60 * 1000 + 59 * 1000);

                // 1. Construction
                const constructionRes = await prisma.constructionReservation.findMany({
                    where: { startTime: { gte: resTargetStart, lt: resTargetEnd } },
                    include: { alliance: { select: { name: true, id: true } } }
                });

                for (const res of constructionRes) {
                    try {
                        await sendPushNotification(res.userId, {
                            title: `🏗️ Construction in 5 minutes!`,
                            message: `Your reservation at ${res.alliance.name} is starting soon.`,
                            url: `/alliances/${res.alliance.id}`
                        });
                    } catch (e) { console.error("Push Error (Construction)", e); }
                }

                // 2. Training
                const trainingRes = await prisma.trainingReservation.findMany({
                    where: { startTime: { gte: resTargetStart, lt: resTargetEnd } },
                    include: { alliance: { select: { name: true, id: true } } }
                });

                for (const res of trainingRes) {
                    try {
                        await sendPushNotification(res.userId, {
                            title: `⚔️ Training in 5 minutes!`,
                            message: `Your training slot at ${res.alliance.name} is starting soon.`,
                            url: `/alliances/${res.alliance.id}`
                        });
                    } catch (e) { console.error("Push Error (Training)", e); }
                }
            } catch (error) {
                console.error("⏰ Event Notification Scheduler non-fatal error:", error);
            }
        }, 60 * 1000); // Check every 60 seconds
    }
}
