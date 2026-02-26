// const fetch = require('node-fetch');

async function testSlug(slug: string, expectedStatus: number) {
    console.log(`Testing slug: "${slug}"...`);
    try {
        const res = await fetch(`http://localhost:3000/api/post/list?boardSlug=${encodeURIComponent(slug)}`);
        if (res.status === expectedStatus) {
            console.log(`✅ Passed: Got ${res.status} as expected.`);
        } else {
            console.error(`❌ Failed: Expected ${expectedStatus}, got ${res.status}`);
            console.error(await res.text());
        }
    } catch (e) {
        console.error(`❌ Error connecting:`, e);
    }
}

async function run() {
    console.log("--- Starting Security Verification (URL Slugs) ---");

    // 1. Valid Slug (assuming 'general' or similar exists, or one we know)
    // We'll skip exact valid check unless we know one, but let's try 'qna' or similar if they exist.
    // Better: Test clearly invalid ones.

    // 2. Random/Invalid Strings
    await testSlug("invalid-slug-12345", 404);
    await testSlug("!@#$%^&*()", 404);
    await testSlug("../../../etc/passwd", 404); // Path traversal attempt check

    // 3. SQL Injection attempt style (though Prisma handles this, ensuring 404 or 400 is key)
    await testSlug("' OR 1=1 --", 404);

    console.log("--- Verification Complete ---");
}

run();
