
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.board.updateMany({
        where: { title: "자유게시판" },
        data: { isGlobal: true }
    });
    console.log("Updated:", result);
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
