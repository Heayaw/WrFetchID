import fetch from "node-fetch";
import fs from "fs";

const gameId = "o6gk45o1";

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

    if (!json.data.runs || json.data.runs.length === 0) {
        return null;
    }

    const run = json.data.runs[0].run;

    return {
        categoryId,
        categoryName: json.data.category,
        runId: run.id,
        time: run.times.primary,
        players: run.players,
        weblink: run.weblink
    };
}

async function main() {
    const categories = await getCategories();
    const results = [];

    for (const c of categories) {
        const wr = await getWR(c.id);
        if (wr) results.push(wr);
    }

    fs.writeFileSync("wr.json", JSON.stringify(results, null, 2));
    console.log("WRs updated.");
}

main();
