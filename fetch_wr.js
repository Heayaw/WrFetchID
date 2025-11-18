import fetch from "node-fetch";
import fs from "fs";

const gameId = "o6gk45o1";

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getCategories() {
    const url = `https://www.speedrun.com/api/v1/games/${gameId}/categories`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
}

async function getWR(categoryId) {
    const url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}?top=1`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.runs || json.data.runs.length === 0) {
        return null;
    }

    const run = json.data.runs[0].run;

    const players = run.players.map(p => {
        if (p.rel === "user") return p.id;
        else if (p.rel === "guest") return p.name;
        return "Unknown";
    });

    return {
        categoryId: categoryId,
        categoryName: json.data.category || "Unknown",
        runId: run.id,
        time: run.times.primary,
        players,
        weblink: run.weblink
    };
}

async function main() {
    console.log("Fetching categories...");
    const categories = await getCategories();
    console.log(`Found ${categories.length} categories.`);

    const results = [];

    for (const c of categories) {
        console.log(`Fetching WR for category: ${c.id} (${c.name || c["name"]})`);
        const wr = await getWR(c.id);
        if (wr) results.push(wr);
        await delay(500);
    }

    fs.writeFileSync("wr.json", JSON.stringify(results, null, 2));
    console.log(`Done! Saved ${results.length} WRs to wr.json`);
}

main();
