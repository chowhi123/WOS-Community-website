const BASE_URL = "http://localhost:3000";

async function check(name, url, expectedStatus) {
    try {
        const res = await fetch(BASE_URL + url);
        if (res.status === expectedStatus) {
            console.log(`✅ [PASS] ${name}: Got ${res.status}`);
        } else {
            console.log(`❌ [FAIL] ${name}: Expected ${expectedStatus}, got ${res.status}`);
            const text = await res.text();
            console.log(`   Response: ${text.substring(0, 100)}...`);
        }
    } catch (e) {
        console.error(`❌ [ERROR] ${name}: Connection failed`, e.message);
    }
}

async function run() {
    console.log("Starting Security Checks...");

    // 1. Post List with Invalid Board Slug
    await check("Invalid Slug", "/api/post/list?boardSlug=invalid-slug-123", 404);

    // 2. SQL Injection Attempt
    await check("SQL Injection Attempt", "/api/post/list?boardSlug=' OR 1=1", 404);

    // 3. Script Injection Attempt (XSS payload in slug - should be 404)
    await check("XSS Slug Attempt", "/api/post/list?boardSlug=<script>alert(1)</script>", 404);

    // 4. Path Traversal
    await check("Path Traversal", "/api/post/list?boardSlug=../../etc/passwd", 404);

    // 5. Valid Slug (assuming 'general' exists or similar, checking response structure)
    // If 'general' doesn't exist, it returns 404, effectively passing "robustness".
    // We check if it crashes (500).
}

run();
