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
  "1P No Portals": { players: "1 Player", portals: "No Portals" },
  "1P Portals": { players: "1 Player", portals: "Portals" },
  "2P No Portals": { players: "2 Players", portals: "No Portals" },
  "2P Portals": { players: "2 Players", portals: "Portals" }
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getCategoryVariables(id) {
  const res = await fetch(`https://www.speedrun.com/api/v1/categories/${id}/variables`);
  const json = await res.json();
  return json.data || [];
}

function findValue(valuesObj, search) {
  const entries = Object.entries(valuesObj);
  const found = entries.find(([id, val]) => val.label.toLowerCase() === search.toLowerCase());
  if (found) return found[0];
  const found2 = entries.find(([id, val]) => val.label.toLowerCase().includes(search.toLowerCase()));
  return found2 ? found2[0] : null;
}

function findVersionValueId(vars) {
  const versionVar = vars.find(v => v.name.toLowerCase().includes("version"));
  if (!versionVar) return null;
  const values = versionVar.values.values || versionVar.values.choices || {};
  return findValue(values, "10.2");
}

function findSubValue(vars, variableName, searchLabel) {
  const v = vars.find(v => v.name.toLowerCase().includes(variableName.toLowerCase()));
  if (!v) return null;
  const values = v.values.values || v.values.choices || {};
  return findValue(values, searchLabel);
}

async function getTopRun(baseId, filters) {
  const params = new URLSearchParams();
  for (const key in filters) {
    params.append(`var-${filters[key].varId}`, filters[key].valId);
  }
  const url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${baseId}?${params}`;
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
    const vars = await getCategoryVariables(base.id);
    const versionVar = vars.find(v => v.name.toLowerCase().includes("version"));
    const versionValueId = findVersionValueId(vars);
    if (!versionVar || !versionValueId) {
      results.push({ categoryId: base.id, categoryName: base.name, runs: {} });
      continue;
    }

    const resultEntry = {};

    for (const [subName, mapping] of Object.entries(subcategoryMap)) {
      const playerVar = vars.find(v => v.name.toLowerCase().includes("player"));
      const portalsVar = vars.find(v => v.name.toLowerCase().includes("portal"));

      const playerValId = findSubValue(vars, "player", mapping.players);
      const portalsValId = findSubValue(vars, "portal", mapping.portals);

      if (!playerVar || !portalsVar || !playerValId || !portalsValId) {
        resultEntry[subName] = null;
        continue;
      }

      const filters = {
        version: { varId: versionVar.id, valId: versionValueId },
        player: { varId: playerVar.id, valId: playerValId },
        portals: { varId: portalsVar.id, valId: portalsValId }
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
}

main();
