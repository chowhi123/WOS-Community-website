
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const boards = await prisma.board.findMany({
        select: { id: true, title: true, slug: true, availableCategories: true }
    });
    console.log("BOARDS:", JSON.stringify(boards, null, 2));

    const posts = await prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { board: { select: { title: true } } }
    });
    console.log("POSTS:", JSON.stringify(posts.map(p => ({
        title: p.title,
        category: p.category,
        boardTitle: p.board?.title || "No Board"
    })), null, 2));
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
