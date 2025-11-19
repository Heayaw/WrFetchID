import fetch from "node-fetch";
import fs from "fs";

const gameId = "o6gk45o1";

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

const subcategoryMap = {
  "1P No Portals": { players: "1P", portals: "No Portals" },
  "1P Portals": { players: "1P", portals: "Portals" },
  "2P No Portals": { players: "2P", portals: "No Portals" },
  "2P Portals": { players: "2P", portals: "Portals" }
};

const globalVars = {
  player: { id: "wleg27kn", values: { "1P": "qox2xvgq", "2P": "139496k1" } },
  portals: { id: "68k1gzyl", values: { "No Portals": "qvvzvy5q", "Portals": "le2v2xpl" } },
  version: { id: "wl3vo5y8", values: { "10.2": "1w4o0evq" } }
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getTopRun(categoryId, filters) {
  const params = new URLSearchParams();
  for (const key in filters) {
    params.append(`var-${filters[key].varId}`, filters[key].valId);
  }
  const url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}?${params}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.data || !json.data.runs || json.data.runs.length === 0) return null;

  const run = json.data.runs[0].run;
  const players = run.players.map(p => p.rel === "user" ? p.id : p.name);
  return { runId: run.id, time: run.times.primary, players, weblink: run.weblink };
}

async function main() {
  const results = [];

  for (const base of baseCategories) {
    const resultEntry = {};

    for (const [subName, mapping] of Object.entries(subcategoryMap)) {
      const filters = {
        player: { varId: globalVars.player.id, valId: globalVars.player.values[mapping.players] },
        portals: { varId: globalVars.portals.id, valId: globalVars.portals.values[mapping.portals] },
        version: { varId: globalVars.version.id, valId: globalVars.version.values["10.2"] }
      };

      const run = await getTopRun(base.id, filters);
      resultEntry[subName] = run;
      await delay(200);
    }

    results.push({
      categoryId: base.id,
      categoryName: base.name,
      runs: resultEntry
    });
  }

  fs.writeFileSync("wr.json", JSON.stringify(results, null, 2));
  console.log("WRs saved to wr.json");
}

main();
