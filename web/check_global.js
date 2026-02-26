
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const board = await prisma.board.findFirst({
        where: { title: "자유게시판" }
    });
    console.log("Board '자유게시판':", JSON.stringify(board, null, 2));
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
