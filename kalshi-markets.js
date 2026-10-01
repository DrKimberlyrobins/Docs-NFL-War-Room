
// DOC'S NFL WAR ROOM
// Kalshi Market Intelligence
// Historical performance and automatic price comparison

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
    console.error("Team selectors were not found.");
    return;
  }

  const section = document.createElement("section");

  section.style.cssText = `
    margin:25px auto;
    padding:20px;
    max-width:1250px;
    background:#14251f;
    color:#ffffff;
    border:2px solid #24854b;
    border-radius:12px;
    font-family:Arial,sans-serif;
  `;

  section.innerHTML = `
    <h2 style="color:#50df89">
      KALSHI NFL MARKET INTELLIGENCE
    </h2>

    <p id="kalshiMatchup"></p>

    <p id="kalshiStatus">
      Loading market and player data...
    </p>

    <p style="font-size:12px;color:#c4dfce">
      Historical results are not predictive probabilities.
      Verify the game, player, contract rules and current
      price before making any decision.
    </p>

    <input
      id="kalshiSearch"
      type="search"
      placeholder="Search player or contract..."
      style="
        width:100%;
        max-width:450px;
        padding:12px;
        margin:12px 0;
        border:1px solid #50df89;
        border-radius:6px;
        font-size:15px;
      "
    >

    <div style="overflow-x:auto">
      <table style="
        width:100%;
        min-width:960px;
        border-collapse:collapse;
        font-size:13px;
        text-align:left;
      ">
        <thead>
          <tr style="color:#50df89">
            <th>Player / Market</th>
            <th>YES Ask</th>
            <th>Player Average</th>
            <th>Historical Rate</th>
            <th>Rate - Price</th>
            <th>Spread</th>
            <th>Volume</th>
          </tr>
        </thead>

        <tbody id="kalshiRows"></tbody>
      </table>
    </div>

    <p style="font-size:12px;color:#c4dfce">
      Historical Rate = successful recorded games /
      recorded games. Missing zero-opportunity games
      may affect the results. Rate - Price is a
      mathematical comparison, not a verified betting edge.
      Market prices may be delayed.
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
  let gameLogData = null;
  let updated = "Unknown";

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function selectedTeam(select) {
    return select.selectedOptions[0]
      ?.text.trim() || "";
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

  function possibleCodes(code) {
    return code
      ? [code, ...(aliases[code] || [])]
      : [];
  }

  function selectedCodes() {
    return [
      ...new Set([
        ...possibleCodes(getTeamCode(away)),
        ...possibleCodes(getTeamCode(home))
      ])
    ];
  }

  function getTeamPlayers(code) {
    if (!playerData?.teams) return [];

    const team = possibleCodes(code)
      .map(c => playerData.teams[c])
      .find(Boolean);

    if (!team) return [];

    const players = [
      ...(team.quarterbacks || []),
      ...(team.receivers || []),
      ...(team.rushers || [])
    ];

    return players.filter(p => p.name);
  }

  function surname(name) {
    return String(name || "")
      .replace(/^[A-Za-z]+\./, "")
      .trim()
      .split(/\s+/)
      .pop()
      .toLowerCase();
  }

  function titleContainsSurname(title, name) {
    const last = surname(name);

    if (last.length < 4) return false;

    const escaped = last.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    return new RegExp(
      "\\b" + escaped + "\\b",
      "i"
    ).test(title);
  }

  function eligibleMarket(market) {
    const title = String(market.title || "");
    const combined = [
      market.title,
      market.subtitle
    ].join(" ");

    // Only explicit single-player yardage thresholds.
    if (!/:\s*\d+\+\s*/.test(title)) {
      return false;
    }

    if (
      !/rushing yards|receiving yards|passing yards|rushing and receiving yards/i
        .test(title)
    ) {
      return false;
    }

    // Exclude season-long and unrelated contract types.
    if (
      /fantasy|regular season|season leader|mvp|award|draft|playoff|most .* yards|ladder/i
        .test(combined)
    ) {
      return false;
    }

    if (title.includes(",")) return false;

    return true;
  }

  function getCategory(title) {
    if (/rushing and receiving yards/i.test(title)) {
      return "combinedRushingReceiving";
    }

    if (/receiving yards/i.test(title)) {
      return "receiving";
    }

    if (/rushing yards/i.test(title)) {
      return "rushing";
    }

    if (/passing yards/i.test(title)) {
      return "passing";
    }

    return null;
  }

  function getThreshold(title) {
    const match = title.match(
      /:\s*(\d+)\+\s*/
    );

    return match
      ? Number(match[1])
      : null;
  }

  function matchingPlayers(market) {
    const title = String(market.title || "");

    if (!eligibleMarket(market)) return [];

    const codes = selectedCodes();

    const candidates = (
      projectionData?.players || []
    ).filter(player => {
      return codes.includes(player.team) &&
        titleContainsSurname(title, player.name);
    });

    const category = getCategory(title);

    // Prefer records containing the relevant category.
    const relevant = candidates.filter(
      player => player.categories?.[category]
    );

    // Remove duplicate records for the same player.
    const unique = new Map();

    relevant.forEach(player => {
      const key = [
        player.team,
        player.playerId || player.name
      ].join(":");

      unique.set(key, player);
    });

    return [...unique.values()];
  }

  function findPlayer(market) {
    const matches = matchingPlayers(market);

    // Never guess between two matching players.
    return matches.length === 1
      ? matches[0]
      : null;
  }

  function findPlayerStats(market) {
    const player = findPlayer(market);

    if (!player) return null;

    const category = getCategory(
      market.title || ""
    );

    return player.categories?.[category] || null;
  }

  function samePlayer(log, player) {
    if (log.team !== player.team) return false;

    if (player.playerId && log.playerId) {
      return player.playerId === log.playerId;
    }

    return normalize(log.player) ===
      normalize(player.name);
  }

  function getRecordedYards(player, category) {
    const logs = gameLogData?.logs || [];

    const playerLogs = logs.filter(
      log => samePlayer(log, player)
    );

    if (category !== "combinedRushingReceiving") {
      return playerLogs
        .filter(log =>
          log.category === category &&
          Number.isFinite(Number(log.yards))
        )
        .map(log => ({
          gameId: log.gameId,
          yards: Number(log.yards)
        }));
    }

    // Combined yardage requires both category
    // records from the same game.
    const games = new Map();

    playerLogs.forEach(log => {
      if (
        !["rushing", "receiving"]
          .includes(log.category)
      ) {
        return;
      }

      if (!Number.isFinite(Number(log.yards))) {
        return;
      }

      if (!games.has(log.gameId)) {
        games.set(log.gameId, {});
      }

      games.get(log.gameId)[log.category] =
        Number(log.yards);
    });

    return [...games.entries()]
      .filter(([, values]) =>
        Number.isFinite(values.rushing) &&
        Number.isFinite(values.receiving)
      )
      .map(([gameId, values]) => ({
        gameId,
        yards: values.rushing +
          values.receiving
      }));
  }

  function calculateHistoricalRate(market) {
    const player = findPlayer(market);

    if (!player) return null;

    const category = getCategory(
      market.title || ""
    );

    const threshold = getThreshold(
      market.title || ""
    );

    if (
      !category ||
      threshold === null
    ) {
      return null;
    }

    const results = getRecordedYards(
      player,
      category
    );

    // We require at least two recorded games
    // even to display a descriptive rate.
    if (results.length < 2) {
      return null;
    }

    const hits = results.filter(
      game => game.yards >= threshold
    ).length;

    return {
      hits,
      games: results.length,
      rate: hits / results.length
    };
  }

  function validPrice(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function makeCell(value, index) {
    const td = document.createElement("td");

    td.textContent = String(value);

    td.style.cssText = `
      padding:10px 8px;
      border-bottom:1px solid #35445b;
      vertical-align:top;
      overflow-wrap:anywhere;
      ${index ? "text-align:right;" : ""}
    `;

    return td;
  }

  function render() {
    const awayName = selectedTeam(away);
    const homeName = selectedTeam(home);

    matchupLabel.textContent =
      awayName + " vs. " + homeName;

    const codes = selectedCodes();

    const query = search.value
      .trim()
      .toLowerCase();

    const matching = markets
      .filter(market => {
        if (!eligibleMarket(market)) {
          return false;
        }

        const title = market.title || "";

        const players = codes.flatMap(
          code => getTeamPlayers(code)
        );

        const matchesSelectedPlayer =
          players.some(player =>
            titleContainsSurname(
              title,
              player.name
            )
          );

        if (!matchesSelectedPlayer) {
          return false;
        }

        if (!query) return true;

        return [
          market.title,
          market.subtitle,
          market.ticker
        ].join(" ")
          .toLowerCase()
          .includes(query);
      });

    rows.replaceChildren();

    matching.slice(0, 100).forEach(market => {
      const tr = document.createElement("tr");

      const bid = validPrice(market.yesBid);
      const ask = validPrice(market.yesAsk);

      const pricesOK =
        bid !== null &&
        ask !== null &&
        ask > 0 &&
        ask <= 1 &&
        bid >= 0 &&
        ask >= bid;

      const stats = findPlayerStats(market);

      const average = stats
        ? stats.averageYards +
          " yds / " +
          stats.recordedGames +
          " games"
        : "—";

      const historical =
        calculateHistoricalRate(market);

      const rateText = historical
        ? (historical.rate * 100)
            .toFixed(1) +
          "% (" +
          historical.hits +
          "/" +
          historical.games +
          ")"
        : "Insufficient data";

      let comparison = "—";

      if (historical && pricesOK) {
        const difference =
          (historical.rate - ask) * 100;

        comparison =
          (difference > 0 ? "+" : "") +
          difference.toFixed(1) +
          " pp";
      }

      const spread = pricesOK
        ? ((ask - bid) * 100)
            .toFixed(1) + "¢"
        : "—";

      const values = [
        market.title || "Unknown",
        pricesOK
          ? (ask * 100).toFixed(1) + "¢"
          : "—",
        average,
        rateText,
        comparison,
        spread,
        market.volume ?? "—"
      ];

      values.forEach((value, index) => {
        const td = makeCell(value, index);

        // Green only for verified data display.
        // No green betting recommendation signals.
        if (
          index === 3 &&
          historical
        ) {
          td.style.color = "#50df89";
        }

        tr.appendChild(td);
      });

      rows.appendChild(tr);
    });

    status.textContent =
      matching.length.toLocaleString() +
      " matching contracts | " +
      Math.min(matching.length, 100) +
      " displayed | Updated: " +
      updated;

    if (!matching.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      td.colSpan = 7;

      td.textContent =
        "No matching yardage contracts found. " +
        "Try another player or selected teams.";

      td.style.padding = "15px";

      tr.appendChild(td);
      rows.appendChild(tr);
    }
  }

  try {
    const cache = "?t=" + Date.now();

    const responses = await Promise.all([
      fetch("data/kalshi-markets.json" + cache),
      fetch("data/players-2026.json" + cache),
      fetch("data/player-projections-2026.json" + cache),
      fetch("data/player-gamelogs-2026.json" + cache)
    ]);

    if (responses.some(response => !response.ok)) {
      throw new Error(
        "One or more required data files could not load."
      );
    }

    const [
      marketResponse,
      playerResponse,
      projectionResponse,
      logResponse
    ] = responses;

    const marketData =
      await marketResponse.json();

    playerData =
      await playerResponse.json();

    projectionData =
      await projectionResponse.json();

    gameLogData =
      await logResponse.json();

    markets = marketData.markets || [];

    updated = marketData.updated || "Unknown";

    console.log(
      "Kalshi contracts loaded:",
      markets.length
    );

    console.log(
      "Player summaries loaded:",
      projectionData.players?.length || 0
    );

    console.log(
      "Individual game records loaded:",
      gameLogData.logs?.length || 0
    );

    away.addEventListener("change", render);
    home.addEventListener("change", render);
    search.addEventListener("input", render);

    render();

  } catch (error) {
    status.textContent =
      "Data loading error: " + error.message;

    console.error(error);
  }

})();
