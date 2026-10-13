// Node 18+ has native fetch. If on older node, install node-fetch.
// const fetch = require('node-fetch'); 

const API_URL = "http://localhost:8787/api/chat"; // Or your Worker URL
const SYSTEM_API_URL = "http://localhost:3000/api/chat";

async function testChat(url, message, history = []) {
    console.log(`\n--- Testing Chat at ${url} ---`);
    console.log(`User: ${message}`);

    try {
        const start = Date.now();
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history })
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return;
        }

        const data = await res.json();
        const duration = Date.now() - start;
        console.log(`Bot (${duration}ms): ${data.reply}`);
        return data;
    } catch (e) {
        console.error("Request Failed:", e.message);
    }
}

async function runTests() {
    // 1. Test System Route (Next.js)
    // await testChat(SYSTEM_API_URL, "Do you have any red saris?");

    // 2. Test Worker Route (assuming local wrangler dev is running or deployed)
    // Since we can't run wrangler dev easily here, we might just script it for the user to run.
    console.log("To test Worker, run 'npx wrangler dev' in cloudflare-workers/ folder.");
    console.log("Then update the URL in this script.");

    // For now, let's test the Logic if the user runs this against a deployed worker
    // or if they start the next server. 
    // We will default to the System URL for this environment since we are mostly testing the prompt/logic
    // But the user specifically asked to "check test karo node se".

    await testChat(SYSTEM_API_URL, "Hi, who are you?");
    const res1 = await testChat(SYSTEM_API_URL, "Do you sell silk saris?");
    if (res1) {
        await testChat(SYSTEM_API_URL, "Which ones are under 2000?", [
            { role: 'user', content: "Do you sell silk saris?" },
            { role: 'bot', content: res1.reply }
        ]);
    }
}

runTests();
