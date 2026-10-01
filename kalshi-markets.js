
// DOC'S NFL WAR ROOM
// AUTOMATIC TWO-TEAM KALSHI MARKET FILTER

(async function () {
  "use strict";

  const teamCodes = {
    "Arizona Cardinals": "ARI",
    "Atlanta Falcons": "ATL",
    "Baltimore Ravens": "BAL",
    "Buffalo Bills": "BUF",
    "Carolina Panthers": "CAR",
    "Chicago Bears": "CHI",
    "Cincinnati Bengals": "CIN",
    "Cleveland Browns": "CLE",
    "Dallas Cowboys": "DAL",
    "Denver Broncos": "DEN",
    "Detroit Lions": "DET",
    "Green Bay Packers": "GB",
    "Houston Texans": "HOU",
    "Indianapolis Colts": "IND",
    "Jacksonville Jaguars": "JAX",
    "Kansas City Chiefs": "KC",
    "Las Vegas Raiders": "LV",
    "Los Angeles Chargers": "LAC",
    "Los Angeles Rams": "LA",
    "Miami Dolphins": "MIA",
    "Minnesota Vikings": "MIN",
    "New England Patriots": "NE",
    "New Orleans Saints": "NO",
    "New York Giants": "NYG",
    "New York Jets": "NYJ",
    "Philadelphia Eagles": "PHI",
    "Pittsburgh Steelers": "PIT",
    "San Francisco 49ers": "SF",
    "Seattle Seahawks": "SEA",
    "Tampa Bay Buccaneers": "TB",
    "Tennessee Titans": "TEN",
    "Washington Commanders": "WAS"
  };

  const aliases = {
    LA: ["LAR"],
    JAX: ["JAC"],
    WAS: ["WSH"]
  };

  const away = document.getElementById("away");
  const home = document.getElementById("home");

  if (!away || !home) {
    console.error("Kalshi: Team dropdowns not found.");
    return;
  }

  const section = document.createElement("section");
  section.style.cssText = `
    background:#172337;
    color:white;
    padding:16px;
    margin:20px 0;
    border:1px solid #299764;
    border-radius:12px;
    font-family:Arial,sans-serif;
  `;

  section.innerHTML = `
    <h2 style="color:#41d98b">
      KALSHI NFL MARKET INTELLIGENCE
    </h2>

    <p id="kalshiMatchup"></p>
    <p id="kalshiStatus">Loading data...</p>

    <input
      id="kalshiSearch"
      type="search"
      placeholder="Search player or market"
      style="padding:10px;width:100%;box-sizing:border-box"
    >

    <div style="overflow-x:auto;margin-top:12px">
      <table style="
        width:640px;
        max-width:100%;
        table-layout:fixed;
        text-align:left;
        border-collapse:collapse;
        font-size:13px;
      ">
        

<colgroup>
  <col style="width:300px">
  <col style="width:75px">
  <col style="width:140px">
  <col style="width:110px">
  <col style="width:75px">
  <col style="width:95px">
</colgroup>


        <thead>
          
<tr>
  <th>Player / Market</th>
  <th>YES Ask</th>
  <th>Player Average</th>
  <th>Our Projection</th>
  <th>Spread</th>
  <th>Volume</th>
</tr>

        </thead>
        <tbody id="kalshiRows"></tbody>
      </table>
    </div>

    <p style="font-size:12px;color:#aab7c8">
      Research display only. Player-name matching
      requires verification. Prices may be delayed.
    </p>
  `;

  document.body.appendChild(section);

  const matchupLabel =
    document.getElementById("kalshiMatchup");
  const status =
    document.getElementById("kalshiStatus");
  const search =
    document.getElementById("kalshiSearch");
  const rows =
    document.getElementById("kalshiRows");

  let markets = [];
  let playerData = null;
  let projectionData = null;
  
// Find player averages in our statistical database.
function findPlayerStats(market) {
  if (!projectionData?.players) return null;

  const title = market.title || "";

  const category =
    /rushing and receiving|receiving and rushing/i.test(title)
      ? "combinedRushingReceiving"
      : /receiving/i.test(title)
      ? "receiving"
      : /rushing/i.test(title)
      ? "rushing"
      : /passing/i.test(title)
      ? "passing"
      : null;

  if (!category) return null;

  const matches = projectionData.players.filter(player => {
    const surname = player.name
      .replace(/^[A-Za-z]+\./, "")
      .trim();

    const escaped = surname.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    return new RegExp(
      "\\b" + escaped + "\\b",
      "i"
    ).test(title);
  });

  // Never guess when multiple players match.
  if (matches.length !== 1) return null;

  return matches[0].categories?.[category] || null;
}

  function selectedTeam(select) {
    return select.selectedOptions[0]?.text.trim() || "";
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function getTeamCode(select) {
    const name = selectedTeam(select);
    const value = select.value;

    if (teamCodes[name]) return teamCodes[name];
    if (teamCodes[value]) return teamCodes[value];

    const code = String(value).toUpperCase();

    if (/^[A-Z]{2,3}$/.test(code)) {
      return code;
    }

    return null;
  }

  function getTeamPlayers(code) {
    if (!code || !playerData?.teams) return [];

    const possibleCodes = [
      code,
      ...(aliases[code] || [])
    ];

    const team = possibleCodes
      .map(c => playerData.teams[c])
      .find(Boolean);

    if (!team) return [];

    return [
      ...(team.quarterbacks || []),
      ...(team.receivers || []),
      ...(team.rushers || [])
    ]
      .map(player => player.name || "")
      .filter(Boolean);
  }

  function playerSurname(name) {
    // Our NFL data uses names such as J.Warren.
    return name
      .replace(/^[A-Za-z]+\./, "")
      .trim()
      .split(/\s+/)
      .pop()
      .toLowerCase();
  }

  function uniquePlayerSurnames(codes) {
    const allNames = codes.flatMap(getTeamPlayers);
    const counts = new Map();

    allNames.forEach(name => {
      const surname = playerSurname(name);
      if (!surname) return;

      // Count each distinct player only once.
      const key = normalize(name);
      if (!counts.has(surname)) {
        counts.set(surname, new Set());
      }
      counts.get(surname).add(key);
    });

    return [...counts.entries()]
      .filter(([surname, names]) =>
        surname.length >= 4 && names.size === 1
      )
      .map(([surname]) => surname);
  }

  function render() {
    const awayName = selectedTeam(away);
    const homeName = selectedTeam(home);
    const codes = [
      getTeamCode(away),
      getTeamCode(home)
    ];

    matchupLabel.textContent =
      awayName + " vs. " + homeName;

    const surnames = uniquePlayerSurnames(codes);
    const query = search.value.trim().toLowerCase();

    const matching = markets.filter(market => {
      const title = String(market.title || "");
      const subtitle = String(market.subtitle || "");
      const combined = (title + " " + subtitle)
        .toLowerCase();

      // Exclude obvious season-long and fantasy markets.
      if (
        /fantasy|regular season|season leader|mvp|award/i
          .test(combined)
      ) return false;

      // Exclude obvious multi-outcome combinations.
      if (title.includes(",")) return false;

      // Match a player from either selected team.
      const matchesPlayer = surnames.some(surname => {
        const escaped = surname.replace(
          /[.*+?^${}()|[\]\\]/g, "\\$&"
        );
        return new RegExp(
          "\\b" + escaped + "\\b", "i"
        ).test(combined);
      });

      // Match team names for game-level markets.
      const matchesTeam = [awayName, homeName]
        .filter(Boolean)
        .some(name => {
          const nickname = name.split(" ").pop();
          return combined.includes(
            nickname.toLowerCase()
          );
        });

      return matchesPlayer &&
  !/rookie of the year|player of the year|fantasy|leader|season|award/i.test(combined);
    }).filter(market => {
      if (!query) return true;

      return [
        market.title,
        market.subtitle,
        market.ticker
      ].join(" ").toLowerCase().includes(query);
    });

    rows.replaceChildren();

    matching.slice(0, 100).forEach(market => {
      const tr = document.createElement("tr");

      
const bid = Number(market.yesBid);
const ask = Number(market.yesAsk);

const validPrices =
  Number.isFinite(bid) &&
  Number.isFinite(ask) &&
  ask > 0 &&
  ask >= bid;


const stats = findPlayerStats(market);

const statsText = stats
  ? stats.averageYards + " yds / " +
    stats.recordedGames + " games"
  : "—";

const values = [
  market.title || "Unknown",
  validPrices ? (ask * 100).toFixed(1) + "¢" : "—",
  statsText,
  "Pending",
  validPrices ? ((ask - bid) * 100).toFixed(1) + "¢" : "—",
  market.volume ?? "—"
];



      values.forEach((value, index) => {
        const td = document.createElement("td");
        td.textContent = String(value);
        td.style.cssText = `
          padding:7px 8px;
          border-bottom:1px solid #35445b;
          overflow-wrap:anywhere;
          vertical-align:top;
          ${index ? "text-align:right;" : ""}
        `;
        tr.appendChild(td);
      });

      rows.appendChild(tr);
    });

    status.textContent =
      matching.length.toLocaleString() +
      " matching contracts | " +
      Math.min(matching.length, 100) +
      " displayed | Updated: " +
      (window.kalshiUpdated || "Unknown");

    if (!matching.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent =
        "No matching contracts found. Check the " +
        "selected teams or try another search.";
      td.style.padding = "15px";
      tr.appendChild(td);
      rows.appendChild(tr);
    }
  }

  try {
    
const [marketResponse, playerResponse, projectionResponse] =
  await Promise.all([
    fetch("data/kalshi-markets.json?t=" + Date.now()),
    fetch("data/players-2026.json?t=" + Date.now()),
    fetch("data/player-projections-2026.json?t=" + Date.now())
  ]);

    if (!marketResponse.ok || !playerResponse.ok) {
      throw new Error("Could not load data files.");
    }

    const marketData = await marketResponse.json();
    playerData = await playerResponse.json();
if (!projectionResponse.ok) {
  throw new Error("Could not load player projections.");
}

projectionData = await projectionResponse.json();

console.log(
  "Player statistics loaded:",
  projectionData.players.length
);
    markets = marketData.markets || [];
    window.kalshiUpdated = marketData.updated;

    away.addEventListener("change", render);
    home.addEventListener("change", render);
    search.addEventListener("input", render);

    render();

  } catch (error) {
    status.textContent =
      "Kalshi loading error: " + error.message;
    console.error(error);
  }
})();
