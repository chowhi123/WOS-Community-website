
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const boards = await prisma.board.findMany();
    console.log("Boards:", JSON.stringify(boards, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
