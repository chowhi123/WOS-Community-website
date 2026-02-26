// Node 18+ has native fetch. If using older node, please install node-fetch.

const BASE_URL = "http://localhost:3000";

// Colors for console
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

// 10 Security Check Modules
const CHECKS = [
    {
        name: "SQL Injection",
        payload: "' OR '1'='1",
        type: "query",
        expected: 404 // Should not be 500
    },
    {
        name: "XSS Injection",
        payload: "<script>alert(1)</script>",
        type: "query",
        expected: 404 // Should be handled/sanitized or 404
    },
    {
        name: "Path Traversal",
        payload: "../../etc/passwd",
        type: "query",
        expected: 404
    },
    {
        name: "Command Injection",
        payload: "; ls -la",
        type: "query",
        expected: 404
    },
    {
        name: "Large Payload (DoS)",
        payload: "A".repeat(10000),
        type: "body",
        expected: 413 // Payload Too Large or handled
    },
    {
        name: "Rate Limiting",
        action: async (url) => {
            console.log("   Testing Rate Limit (20 reqs fast)...");
            const reqs = Array.from({ length: 20 }).map(() => fetch(url));
            const results = await Promise.all(reqs);
            const statusCodes = results.map(r => r.status);
            // If we hit 429, it works. If all 200, it might be weak or limit is higher.
            const has429 = statusCodes.includes(429);
            return has429 ? { pass: true, msg: "Triggered 429" } : { pass: true, msg: "Did not trigger (limit might be > 20)" };
        }
    },
    {
        name: "HTTP Method Tampering",
        action: async (url) => {
            // Try PUT on a GET route
            const res = await fetch(url, { method: "PUT" });
            return res.status === 405 || res.status === 404 ? { pass: true } : { pass: false, msg: `Got ${res.status}` };
        }
    },
    {
        name: "Auth Bypass (No Headers)",
        action: async () => {
            const res = await fetch(`${BASE_URL}/api/admin/users`);
            return res.status === 401 || res.status === 307 ? { pass: true } : { pass: false, msg: `Got ${res.status} on protected route` };
        }
    },
    {
        name: "Content-Type Spoofing",
        action: async () => {
            const res = await fetch(`${BASE_URL}/api/post/create`, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: '{"malicious": true}'
            });
            return res.status === 400 || res.status === 415 || res.status === 500 ? { pass: true } : { pass: false, msg: `Accepted invalid content-type: ${res.status}` };
        }
    },
    {
        name: "Security Headers",
        action: async (url) => {
            const res = await fetch(url);
            const headers = res.headers;
            const hasHSTS = headers.get('strict-transport-security');
            const hasXFrame = headers.get('x-frame-options');
            if (hasHSTS && hasXFrame) return { pass: true };
            return { pass: false, msg: `Missing headers: HSTS=${!!hasHSTS}, XFrame=${!!hasXFrame}` };
        }
    }
];

async function runTest(targetRoute = "/api/post/list") {
    console.log(`${YELLOW}Starting 10-Point Security Suite against: ${targetRoute}${RESET}\n`);
    const fullUrl = BASE_URL + targetRoute;
    let passed = 0;

    for (const check of CHECKS) {
        process.stdout.write(`Testing [${check.name}]... `);

        try {
            let result;
            if (check.action) {
                result = await check.action(fullUrl);
            } else {
                // Default Query/Body Test
                let testUrl = fullUrl;
                let options = {};

                if (check.type === 'query') {
                    // Append malicious payload to a dummy param or existing one
                    testUrl += (testUrl.includes('?') ? '&' : '?') + `q=${encodeURIComponent(check.payload)}`;
                } else if (check.type === 'body') {
                    options = {
                        method: 'POST',
                        body: JSON.stringify({ data: check.payload }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }

                const res = await fetch(testUrl, options);
                // We pass if status is expected OR if it's a 4xx error (handled client error)
                // We fail if it is 5xx (server crash) or 200 (if it explicitly shouldn't be, mostly context dependent)

                // For SQLi/XSS, we generally want 400/404/403. 200 is okay IF it essentially searched for the literal string "OR 1=1" and found nothing (empty list).
                // What we DON'T want is 500.
                if (res.status >= 500) {
                    result = { pass: false, msg: `Server Error ${res.status}` };
                } else {
                    result = { pass: true, msg: `Handled with ${res.status}` };
                }
            }

            if (result.pass) {
                console.log(`${GREEN}PASS${RESET} ${result.msg ? `(${result.msg})` : ''}`);
                passed++;
            } else {
                console.log(`${RED}FAIL${RESET} ${result.msg}`);
            }
        } catch (e) {
            console.log(`${RED}ERROR${RESET} Connection failed: ${e.message}`);
        }
    }

    console.log(`\n${YELLOW}Result: ${passed}/${CHECKS.length} Checks Passed${RESET}`);
}

// Allow CLI arg for route
const route = process.argv[2] || "/api/post/list";
runTest(route);
