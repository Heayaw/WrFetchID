import fetch from "node-fetch";
import fs from "fs";

const gameId = "o6gk45o1"; // Isle 10 game ID

// Base categories (Plane, Boat, Facility, etc.)
const baseCategories = [
  { id: "rkl1rmqd", name: "Plane" },
  { id: "ndx64l1d", name: "Boat" },
  { id: "w2073mvk", name: "Facility" },
  { id: "wdm36oxk", name: "Truth" },
  { id: "vdol1g1d", name: "Balloon" },
  { id: "wkpx3e02", name: "Hangar" },
  { id: "mke648xd", name: "Orbit" },
  { id: "5dwwgvnd", name: "Sabotage" },
  { id: "jdrml652", name: "Mole" },
  { id: "jdzjw0gk", name: "Hidden" },
  { id: "wk6l86rk", name: "46C" },
  { id: "n2yygxm2", name: "92C" },
  { id: "7kjn644d", name: "CE" },
  { id: "xk9mv16d", name: "AC" },
  { id: "z27x1yzd", name: "Light Lamps" }
];

// Subcategories we want for each base category
const subCategories = [
  { id: "rkl1rmqd", name: "1P No Portals" },
  { id: "mke648xd", name: "1P Portals" },
  { id: "w2073mvk", name: "2P No Portals" },
  { id: "7kjn644d", name: "2P Portals" }
];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getVersion10_2Id(categoryId) {
  const res = await fetch(`https://www.speedrun.com/api/v1/categories/${categoryId}/variables`);
  const json = await res.json();
  const versionVar = Object.values(json.data).find(v => v.name.toLowerCase() === "versions");
  if (!versionVar) return null;
  const value10_2 = Object.entries(versionVar.values.values)
    .find(([id, val]) => val.label === "10.2");
  return value10_2 ? value10_2[0] : null;
}

async function getTopRuns(categoryId, versionId, top = 1) {
  const url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}?top=${top}&var-${versionId}=${versionId}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.data || !json.data.runs) return [];

  return json.data.runs.map(entry => {
    const run = entry.run;
    const players = run.players.map(p => p.rel === "user" ? p.id : p.name);
    return {
      runId: run.id,
      time: run.times.primary,
      players,
      weblink: run.weblink
    };
  });
}

async function main() {
  const results = [];

  for (const base of baseCategories) {
    console.log(`Fetching runs for base category: ${base.name}`);
    const runsForBase = {};

    for (const sub of subCategories) {
      console.log(`  Fetching ${sub.name} (${sub.id})`);
      const versionId = await getVersion10_2Id(sub.id);
      if (!versionId) {
        console.log(`    No 10.2 version found for ${sub.name}`);
        runsForBase[sub.name] = null;
        continue;
      }

      const topRun = await getTopRuns(sub.id, versionId, 1); // just top run per subcategory
      runsForBase[sub.name] = topRun[0] || null;
      await delay(300);
    }

    results.push({
      categoryId: base.id,
      categoryName: base.name,
      runs: runsForBase
    });
  }

  fs.writeFileSync("wr.json", JSON.stringify(results, null, 2));
  console.log("Done! Saved WRs for all base categories with subcategories (10.2) to wr.json");
}

main();
