/* =========================================================
   DOC'S NFL WAR ROOM
   PLAYER PROP RESEARCH & RECORDS
   ========================================================= */

(() => {
  "use strict";

  const RECORDS_URL =
    "https://script.google.com/macros/s/AKfycbxovg8I9EhY3QNZ5Bl81jJDJiQ_Ddr4NwNIyO3lXiNmr0qq5w06hj7dA1DBjuuDUfHI/exec";

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
    "Los Angeles Rams": "LAR",
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

  function clean(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function getRows(bodyId) {
    const body = document.getElementById(bodyId);
    if (!body) return [];

    return Array.from(body.querySelectorAll("tr")).map(row =>
      Array.from(row.querySelectorAll("td")).map(cell =>
        clean(cell.textContent)
      )
    );
  }

  function getMatchup() {
    const away =
      document.getElementById("away")?.value || "";

    const home =
      document.getElementById("home")?.value || "";

    return {
      away,
      home,
      awayCode: teamCodes[away] || away,
      homeCode: teamCodes[home] || home
    };
  }

  function receiverPlayers() {
    return getRows("targetBody")
      .filter(row => row.length >= 15)
      .map(row => ({
        team: row[0],
        player: row[1],
        positionGroup: "Receiver",
        targets: row[2],
        targetsPerGame: row[3],
        receptions: row[4],
        yards: row[5],
        yardsPerGame: row[6],
        yac: row[7],
        yacPerReception: row[8],
        twentyPlus: row[9],
        explosiveRate: row[10],
        catchRate: row[11],
        redZone: row[12],
        inside10: row[13],
        touchdowns: row[14]
      }));
  }

  function runningBackPlayers() {
    return getRows("rushingBody")
      .filter(row => row.length >= 11)
      .map(row => ({
        team: row[0],
        player: row[1],
        positionGroup: "Rusher",
        games: row[2],
        carries: row[3],
        carriesPerGame: row[4],
        rushingYards: row[5],
        rushingYardsPerGame: row[6],
        yardsPerCarry: row[7],
        rushingTDs: row[8],
        redZoneCarries: row[9],
        inside10Carries: row[10]
      }));
  }

  function quarterbackPlayers() {
    return getRows("qbPassingBody")
      .filter(row => row.length >= 10)
      .map(row => ({
        team: row[0],
        player: row[1],
        positionGroup: "Quarterback",
        attempts: row[2],
        completions: row[3],
        completionRate: row[4],
        attemptsPerGame: row[5],
        passingYards: row[6],
        yardsPerAttempt: row[7],
        passingTDs: row[8],
        interceptions: row[9]
      }));
  }

  function allPlayers() {
    const map = new Map();

    [
      ...receiverPlayers(),
      ...runningBackPlayers(),
      ...quarterbackPlayers()
    ].forEach(player => {
      const key = `${player.team}|${player.player}`;

      if (!map.has(key)) {
        map.set(key, {
          team: player.team,
          player: player.player
        });
      }

      Object.assign(map.get(key), player);
    });

    return Array.from(map.values());
  }

  function findDefense(team) {
    const row = getRows("defenseBody")
      .find(r => r[0] === team);

    if (!row) return {};

    return {
      defenseGames: row[1] || "",
      twentyPlusAllowed: row[2] || "",
      twentyPlusAllowedPerGame: row[3] || "",
      yacAllowed: row[4] || "",
      yacAllowedPerGame: row[5] || ""
    };
  }

  function selectedPlayer() {
    const select =
      document.getElementById("propPlayer");

    if (!select) return null;

    const [team, player] =
      select.value.split("|||");

    return allPlayers().find(
      p => p.team === team && p.player === player
    ) || null;
  }

  function populatePropPlayers() {
    const select =
      document.getElementById("propPlayer");

    if (!select) return;

    const previous = select.value;

    select.innerHTML =
      `<option value="">Select player</option>`;

    allPlayers()
      .sort((a, b) => {
        const teamCompare =
          a.team.localeCompare(b.team);

        if (teamCompare !== 0) return teamCompare;

        return a.player.localeCompare(b.player);
      })
      .forEach(p => {
        const option =
          document.createElement("option");

        option.value =
          `${p.team}|||${p.player}`;

        option.textContent =
          `${teamCodes[p.team] || p.team} — ${p.player}`;

        select.appendChild(option);
      });

    if (
      previous &&
      Array.from(select.options)
        .some(option => option.value === previous)
    ) {
      select.value = previous;
    }

    showPlayerResearch();
  }

  function showPlayerResearch() {
    const box =
      document.getElementById("propResearch");

    if (!box) return;

    const p = selectedPlayer();

    if (!p) {
      box.innerHTML =
        "Select a player to view War Room research.";
      return;
    }

    const matchup = getMatchup();

    const opponent =
      p.team === matchup.away
        ? matchup.home
        : matchup.away;

    const defense = findDefense(opponent);

    const items = [];

    if (p.attempts)
      items.push(`Pass Attempts: ${p.attempts}`);

    if (p.attemptsPerGame)
      items.push(
        `Pass Attempts/Game: ${p.attemptsPerGame}`
      );

    if (p.passingYards)
      items.push(`Passing Yards: ${p.passingYards}`);

    if (p.yardsPerAttempt)
      items.push(`Yards/Attempt: ${p.yardsPerAttempt}`);

    if (p.passingTDs)
      items.push(`Passing TDs: ${p.passingTDs}`);

    if (p.targets)
      items.push(`Targets: ${p.targets}`);

    if (p.targetsPerGame)
      items.push(
        `Targets/Game: ${p.targetsPerGame}`
      );

    if (p.receptions)
      items.push(`Receptions: ${p.receptions}`);

    if (p.yards)
      items.push(`Receiving Yards: ${p.yards}`);

    if (p.yardsPerGame)
      items.push(
        `Receiving Yards/Game: ${p.yardsPerGame}`
      );

    if (p.twentyPlus)
      items.push(`20+ Catches: ${p.twentyPlus}`);

    if (p.redZone)
      items.push(`Red Zone Targets: ${p.redZone}`);

    if (p.inside10)
      items.push(`Inside 10 Targets: ${p.inside10}`);

    if (p.touchdowns)
      items.push(`Receiving TDs: ${p.touchdowns}`);

    if (p.carries)
      items.push(`Carries: ${p.carries}`);

    if (p.carriesPerGame)
      items.push(
        `Carries/Game: ${p.carriesPerGame}`
      );

    if (p.rushingYards)
      items.push(
        `Rushing Yards: ${p.rushingYards}`
      );

    if (p.rushingYardsPerGame)
      items.push(
        `Rushing Yards/Game: ${p.rushingYardsPerGame}`
      );

    if (p.yardsPerCarry)
      items.push(
        `Yards/Carry: ${p.yardsPerCarry}`
      );

    if (p.rushingTDs)
      items.push(`Rushing TDs: ${p.rushingTDs}`);

    if (p.redZoneCarries)
      items.push(
        `Red Zone Carries: ${p.redZoneCarries}`
      );

    if (p.inside10Carries)
      items.push(
        `Inside 10 Carries: ${p.inside10Carries}`
      );

    items.push(`Opponent: ${opponent}`);

    if (defense.twentyPlusAllowedPerGame)
      items.push(
        `Opponent 20+ Allowed/Game: ` +
        defense.twentyPlusAllowedPerGame
      );

    if (defense.yacAllowedPerGame)
      items.push(
        `Opponent YAC Allowed/Game: ` +
        defense.yacAllowedPerGame
      );

    box.innerHTML = items
      .map(item => `<div>${item}</div>`)
      .join("");
  }

  function buildPropRecord() {
    const p = selectedPlayer();

    if (!p) {
      throw new Error("Select a player.");
    }

    const matchup = getMatchup();

    const opponent =
      p.team === matchup.away
        ? matchup.home
        : matchup.away;

    const defense = findDefense(opponent);

    const market =
      clean(
        document.getElementById("propMarket")?.value
      );

    const line =
      clean(
        document.getElementById("propLine")?.value
      );

    const price =
      clean(
        document.getElementById("propPrice")?.value
      );

    const projection =
      clean(
        document.getElementById("propProjection")?.value
      );

    const edge =
      clean(
        document.getElementById("propEdge")?.value
      );

    const verdict =
      clean(
        document.getElementById("propVerdict")?.value
      );

    const reason =
      clean(
        document.getElementById("propReason")?.value
      );

    if (!market)
      throw new Error("Select a prop market.");

    if (!line)
      throw new Error("Enter the sportsbook line.");

    if (!verdict)
      throw new Error("Select QUALIFY, LEAN, or PASS.");

    return {
      type: "prop",
      timestamp: "",

      matchup:
        `${matchup.awayCode} — ${matchup.away} @ ` +
        `${matchup.homeCode} — ${matchup.home}`,

      team: p.team,
      teamCode: teamCodes[p.team] || p.team,

      opponent: opponent,
      opponentCode:
        teamCodes[opponent] || opponent,

      homeAway:
        p.team === matchup.away ? "Away" : "Home",

      player: p.player,
      positionGroup: p.positionGroup || "",

      market: market,
      sportsbookLine: line,
      price: price,

      warRoomProjection: projection,
      calculatedEdge: edge,

      games: p.games || "",

      passAttempts: p.attempts || "",
      completions: p.completions || "",
      completionRate: p.completionRate || "",
      passAttemptsPerGame:
        p.attemptsPerGame || "",
      passingYards: p.passingYards || "",
      yardsPerAttempt: p.yardsPerAttempt || "",
      passingTDs: p.passingTDs || "",
      interceptions: p.interceptions || "",

      targets: p.targets || "",
      targetsPerGame: p.targetsPerGame || "",
      receptions: p.receptions || "",
      receivingYards: p.yards || "",
      receivingYardsPerGame:
        p.yardsPerGame || "",
      yac: p.yac || "",
      yacPerReception:
        p.yacPerReception || "",
      twentyPlusCatches: p.twentyPlus || "",
      explosiveRate: p.explosiveRate || "",
      catchRate: p.catchRate || "",
      redZoneTargets: p.redZone || "",
      inside10Targets: p.inside10 || "",
      receivingTDs: p.touchdowns || "",

      carries: p.carries || "",
      carriesPerGame: p.carriesPerGame || "",
      rushingYards: p.rushingYards || "",
      rushingYardsPerGame:
        p.rushingYardsPerGame || "",
      yardsPerCarry: p.yardsPerCarry || "",
      rushingTDs: p.rushingTDs || "",
      redZoneCarries: p.redZoneCarries || "",
      inside10Carries:
        p.inside10Carries || "",

      opponentDefenseGames:
        defense.defenseGames || "",

      opponent20PlusAllowed:
        defense.twentyPlusAllowed || "",

      opponent20PlusAllowedPerGame:
        defense.twentyPlusAllowedPerGame || "",

      opponentYACAllowed:
        defense.yacAllowed || "",

      opponentYACAllowedPerGame:
        defense.yacAllowedPerGame || "",

      verdict: verdict,
      reason: reason,

      actualResult: "",
      finalOutcome: "",
      postgameNotes: ""
    };
  }

  async function saveProp() {
    const button =
      document.getElementById("savePropRecord");

    const status =
      document.getElementById("propSaveStatus");

    try {
      button.disabled = true;
      button.textContent = "SAVING PROP...";

      const record = buildPropRecord();

      status.textContent =
        "Saving player prop research...";

      const response = await fetch(RECORDS_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },
        body: JSON.stringify(record)
      });

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error(
          result.message ||
          "Player Props did not confirm save."
        );
      }

      status.textContent =
        `SAVED: ${record.player} — ` +
        `${record.market} ${record.sportsbookLine}`;

      button.textContent = "PROP SAVED";

    } catch (error) {
      console.error("Player Props error:", error);

      status.textContent =
        "SAVE FAILED: " + error.message;

      button.textContent =
        "SAVE PLAYER PROP";

    } finally {
      button.disabled = false;
    }
  }

  function clearPropForm() {
    [
      "propLine",
      "propPrice",
      "propProjection",
      "propEdge",
      "propReason"
    ].forEach(id => {
      const element =
        document.getElementById(id);

      if (element) element.value = "";
    });

    const market =
      document.getElementById("propMarket");

    const verdict =
      document.getElementById("propVerdict");

    if (market) market.value = "";
    if (verdict) verdict.value = "";

    const status =
      document.getElementById("propSaveStatus");

    if (status)
      status.textContent =
        "Ready for another prop.";
  }

  function createPropsPanel() {
    if (document.getElementById("playerPropsPanel")) {
      return;
    }

    const recordsPanel =
      document.getElementById("recordsBookPanel");

    if (!recordsPanel) {
      setTimeout(createPropsPanel, 250);
      return;
    }

    const panel =
      document.createElement("div");

    panel.className = "panel";
    panel.id = "playerPropsPanel";

    panel.innerHTML = `
      <h2>Player Props Research</h2>

      <p class="note">
        Research and record one player market at a time.
        Saving research does not automatically place a
        play on Doc's Receipt.
      </p>

      <label for="propPlayer">Player</label>
      <select id="propPlayer">
        <option value="">Select player</option>
      </select>

      <div
        id="propResearch"
        class="note"
        style="margin-top:15px; line-height:1.8;"
      >
        Select a player to view War Room research.
      </div>

      <label for="propMarket">Prop Market</label>
      <select id="propMarket">
        <option value="">Select market</option>

        <option value="Passing Yards">
          Passing Yards
        </option>

        <option value="Passing Attempts">
          Passing Attempts
        </option>

        <option value="Passing TDs">
          Passing TDs
        </option>

        <option value="Interceptions">
          Interceptions
        </option>

        <option value="Rushing Yards">
          Rushing Yards
        </option>

        <option value="Rushing Attempts">
          Rushing Attempts
        </option>

        <option value="Receiving Yards">
          Receiving Yards
        </option>

        <option value="Receptions">
          Receptions
        </option>

        <option value="Longest Reception">
          Longest Reception
        </option>

        <option value="Anytime TD">
          Anytime TD
        </option>

        <option value="Other">
          Other
        </option>
      </select>

      <label for="propLine">
        Sportsbook Line / Target
      </label>
      <input
        id="propLine"
        type="text"
        placeholder="Example: Over 72.5"
        style="
          width:100%;
          padding:12px;
          border-radius:7px;
          font-size:16px;
        "
      >

      <label for="propPrice">
        Price / Odds
      </label>
      <input
        id="propPrice"
        type="text"
        placeholder="Example: -110"
        style="
          width:100%;
          padding:12px;
          border-radius:7px;
          font-size:16px;
        "
      >

      <label for="propProjection">
        War Room Projection / Target
      </label>
      <input
        id="propProjection"
        type="text"
        placeholder="Enter only when supported"
        style="
          width:100%;
          padding:12px;
          border-radius:7px;
          font-size:16px;
        "
      >

      <label for="propEdge">
        Calculated Edge
      </label>
      <input
        id="propEdge"
        type="text"
        placeholder="Example: +8.4 yards"
        style="
          width:100%;
          padding:12px;
          border-radius:7px;
          font-size:16px;
        "
      >

      <label for="propVerdict">
        War Room Verdict
      </label>
      <select id="propVerdict">
        <option value="">Select verdict</option>
        <option value="QUALIFY">QUALIFY</option>
        <option value="LEAN">LEAN</option>
        <option value="PASS">PASS</option>
      </select>

      <label for="propReason">
        Reason / Supporting Signals
      </label>

      <textarea
        id="propReason"
        rows="4"
        placeholder="Why does this qualify, lean, or pass?"
        style="
          width:100%;
          padding:12px;
          border-radius:7px;
          font-size:16px;
          resize:vertical;
        "
      ></textarea>

      <button
        id="savePropRecord"
        type="button"
      >
        SAVE PLAYER PROP
      </button>

      <button
        id="clearPropForm"
        type="button"
      >
        CLEAR FOR NEXT PROP
      </button>

      <p
        id="propSaveStatus"
        class="status"
      >
        No player prop saved yet.
      </p>
    `;

    recordsPanel.parentNode.insertBefore(
      panel,
      recordsPanel
    );

    document
      .getElementById("propPlayer")
      .addEventListener(
        "change",
        showPlayerResearch
      );

    document
      .getElementById("savePropRecord")
      .addEventListener(
        "click",
        saveProp
      );

    document
      .getElementById("clearPropForm")
      .addEventListener(
        "click",
        clearPropForm
      );

    populatePropPlayers();

    const observer =
      new MutationObserver(() => {
        populatePropPlayers();
      });

    [
      "targetBody",
      "rushingBody",
      "qbPassingBody"
    ].forEach(id => {
      const element =
        document.getElementById(id);

      if (element) {
        observer.observe(element, {
          childList: true,
          subtree: true
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createPropsPanel
    );
  } else {
    createPropsPanel();
  }

})();
