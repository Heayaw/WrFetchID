import fetch from "node-fetch";
import fs from "fs";

const gameId = "o6gk45o1"; // Isle 10 game ID

const categories = [
  { id: "rkl1rmqd", name: "1P No Portals" },
  { id: "mke648xd", name: "1P Portals" },
  { id: "w2073mvk", name: "2P No Portals" },
  { id: "7kjn644d", name: "2P Portals" }
];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getTopRuns(categoryId, top = 4) {
  const url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}?top=${top}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.data || !json.data.runs) return [];

  return json.data.runs.map(entry => {
    const run = entry.run;
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
  });
}

async function main() {
  const results = [];

  for (const c of categories) {
    console.log(`Fetching top 4 runs for category: ${c.name} (${c.id})`);
    const runs = await getTopRuns(c.id, 4);
    results.push({
      categoryId: c.id,
      categoryName: c.name,
      runs
    });
    await delay(500); // polite delay to avoid hammering the API
  }

  fs.writeFileSync("wr.json", JSON.stringify(results, null, 2));
  console.log(`Done! Saved WRs for ${categories.length} categories to wr.json`);
}

main();
