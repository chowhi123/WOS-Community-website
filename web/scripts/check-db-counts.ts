import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const counts = {
        alliances: await prisma.alliance.count(),
        posts: await prisma.post.count(),
        comments: await prisma.comment.count(),
        events: await prisma.event.count(),
        allianceChannels: await prisma.allianceChannel.count(),
        channelMessages: await prisma.channelMessage.count(),
        reservations: await prisma.reservation.count(),
        existingAllianceNames: (await prisma.alliance.findMany({ select: { name: true } })).map(a => a.name)
    };

    fs.writeFileSync('db_counts.json', JSON.stringify(counts, null, 2));
    console.log("Counts written to db_counts.json");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
