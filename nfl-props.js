/* =========================================================
   DOC'S NFL WAR ROOM
   PLAYER PROPS RECORDS — COMPLETE PREGAME SNAPSHOT
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
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function rows(bodyId) {
    const body = document.getElementById(bodyId);

    if (!body) return [];

    return Array.from(body.querySelectorAll("tr"))
      .map(row =>
        Array.from(row.querySelectorAll("td"))
          .map(cell => clean(cell.textContent))
      )
      .filter(row =>
        row.length > 1 &&
        !row[0].toLowerCase().includes("waiting")
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

  function opponentFor(team, matchup) {
    if (team === matchup.away) {
      return matchup.home;
    }

    if (team === matchup.home) {
      return matchup.away;
    }

    return "";
  }

  function getDefense(team) {
    const row =
      rows("defenseBody")
        .find(r => r[0] === team);

    if (!row) {
      return {
        games: "",
        twentyPlusAllowed: "",
        twentyPlusAllowedPerGame: "",
        yacAllowed: "",
        yacAllowedPerGame: ""
      };
    }

    return {
      games: row[1] || "",
      twentyPlusAllowed: row[2] || "",
      twentyPlusAllowedPerGame: row[3] || "",
      yacAllowed: row[4] || "",
      yacAllowedPerGame: row[5] || ""
    };
  }

  function collectReceivers(matchup) {
    return rows("targetBody")
      .filter(row => row.length >= 15)
      .map(row => {
        const team = row[0];
        const opponent =
          opponentFor(team, matchup);
        const defense =
          getDefense(opponent);

        return {
          type: "prop",
          timestamp: "",

          matchup:
            `${matchup.awayCode} — ${matchup.away} @ ` +
            `${matchup.homeCode} — ${matchup.home}`,

          recordCategory: "Receiver",

          team: team,
          teamCode: teamCodes[team] || team,

          opponent: opponent,
          opponentCode:
            teamCodes[opponent] || opponent,

          homeAway:
            team === matchup.away
              ? "Away"
              : "Home",

          player: row[1],

          targets: row[2],
          targetsPerGame: row[3],
          receptions: row[4],
          receivingYards: row[5],
          receivingYardsPerGame: row[6],
          yac: row[7],
          yacPerReception: row[8],
          twentyPlusCatches: row[9],
          explosiveRate: row[10],
          catchRate: row[11],
          redZoneTargets: row[12],
          inside10Targets: row[13],
          receivingTDs: row[14],

          games: "",
          carries: "",
          carriesPerGame: "",
          rushingYards: "",
          rushingYardsPerGame: "",
          yardsPerCarry: "",
          rushingTDs: "",
          redZoneCarries: "",
          inside10Carries: "",

          passAttempts: "",
          completions: "",
          completionRate: "",
          passAttemptsPerGame: "",
          passingYards: "",
          yardsPerAttempt: "",
          passingTDs: "",
          interceptions: "",

          opponentDefenseGames:
            defense.games,

          opponent20PlusAllowed:
            defense.twentyPlusAllowed,

          opponent20PlusAllowedPerGame:
            defense.twentyPlusAllowedPerGame,

          opponentYACAllowed:
            defense.yacAllowed,

          opponentYACAllowedPerGame:
            defense.yacAllowedPerGame,

          propMarket: "",
          sportsbookLine: "",
          price: "",
          warRoomProjection: "",
          calculatedEdge: "",
          verdict: "",
          reason: "",

          actualResult: "",
          finalOutcome: "",
          postgameNotes: ""
        };
      });
  }

  function collectRushers(matchup) {
    return rows("rushingBody")
      .filter(row => row.length >= 11)
      .map(row => {
        const team = row[0];
        const opponent =
          opponentFor(team, matchup);
        const defense =
          getDefense(opponent);

        return {
          type: "prop",
          timestamp: "",

          matchup:
            `${matchup.awayCode} — ${matchup.away} @ ` +
            `${matchup.homeCode} — ${matchup.home}`,

          recordCategory: "Rusher",

          team: team,
          teamCode: teamCodes[team] || team,

          opponent: opponent,
          opponentCode:
            teamCodes[opponent] || opponent,

          homeAway:
            team === matchup.away
              ? "Away"
              : "Home",

          player: row[1],

          targets: "",
          targetsPerGame: "",
          receptions: "",
          receivingYards: "",
          receivingYardsPerGame: "",
          yac: "",
          yacPerReception: "",
          twentyPlusCatches: "",
          explosiveRate: "",
          catchRate: "",
          redZoneTargets: "",
          inside10Targets: "",
          receivingTDs: "",

          games: row[2],
          carries: row[3],
          carriesPerGame: row[4],
          rushingYards: row[5],
          rushingYardsPerGame: row[6],
          yardsPerCarry: row[7],
          rushingTDs: row[8],
          redZoneCarries: row[9],
          inside10Carries: row[10],

          passAttempts: "",
          completions: "",
          completionRate: "",
          passAttemptsPerGame: "",
          passingYards: "",
          yardsPerAttempt: "",
          passingTDs: "",
          interceptions: "",

          opponentDefenseGames:
            defense.games,

          opponent20PlusAllowed:
            defense.twentyPlusAllowed,

          opponent20PlusAllowedPerGame:
            defense.twentyPlusAllowedPerGame,

          opponentYACAllowed:
            defense.yacAllowed,

          opponentYACAllowedPerGame:
            defense.yacAllowedPerGame,

          propMarket: "",
          sportsbookLine: "",
          price: "",
          warRoomProjection: "",
          calculatedEdge: "",
          verdict: "",
          reason: "",

          actualResult: "",
          finalOutcome: "",
          postgameNotes: ""
        };
      });
  }

  function collectQuarterbacks(matchup) {
    return rows("qbPassingBody")
      .filter(row => row.length >= 10)
      .map(row => {
        const team = row[0];
        const opponent =
          opponentFor(team, matchup);

        return {
          type: "prop",
          timestamp: "",

          matchup:
            `${matchup.awayCode} — ${matchup.away} @ ` +
            `${matchup.homeCode} — ${matchup.home}`,

          recordCategory: "Quarterback",

          team: team,
          teamCode: teamCodes[team] || team,

          opponent: opponent,
          opponentCode:
            teamCodes[opponent] || opponent,

          homeAway:
            team === matchup.away
              ? "Away"
              : "Home",

          player: row[1],

          targets: "",
          targetsPerGame: "",
          receptions: "",
          receivingYards: "",
          receivingYardsPerGame: "",
          yac: "",
          yacPerReception: "",
          twentyPlusCatches: "",
          explosiveRate: "",
          catchRate: "",
          redZoneTargets: "",
          inside10Targets: "",
          receivingTDs: "",

          games: "",
          carries: "",
          carriesPerGame: "",
          rushingYards: "",
          rushingYardsPerGame: "",
          yardsPerCarry: "",
          rushingTDs: "",
          redZoneCarries: "",
          inside10Carries: "",

          passAttempts: row[2],
          completions: row[3],
          completionRate: row[4],
          passAttemptsPerGame: row[5],
          passingYards: row[6],
          yardsPerAttempt: row[7],
          passingTDs: row[8],
          interceptions: row[9],

          opponentDefenseGames: "",
          opponent20PlusAllowed: "",
          opponent20PlusAllowedPerGame: "",
          opponentYACAllowed: "",
          opponentYACAllowedPerGame: "",

          propMarket: "",
          sportsbookLine: "",
          price: "",
          warRoomProjection: "",
          calculatedEdge: "",
          verdict: "",
          reason: "",

          actualResult: "",
          finalOutcome: "",
          postgameNotes: ""
        };
      });
  }

  async function postRecord(record) {
    const response =
      await fetch(RECORDS_URL, {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify(record)
      });

    const result =
      await response.json();

    if (result.status !== "success") {
      throw new Error(
        result.message ||
        "Player Props save was not confirmed."
      );
    }

    return result;
  }

  async function savePlayerSnapshot() {
    const button =
      document.getElementById(
        "savePlayerSnapshot"
      );

    const status =
      document.getElementById(
        "playerSnapshotStatus"
      );

    try {
      const matchup = getMatchup();

      if (
        !matchup.away ||
        !matchup.home ||
        matchup.away === matchup.home
      ) {
        throw new Error(
          "Analyze two different teams first."
        );
      }

      const receivers =
        collectReceivers(matchup);

      const rushers =
        collectRushers(matchup);

      const quarterbacks =
        collectQuarterbacks(matchup);

      const records = [
        ...quarterbacks,
        ...receivers,
        ...rushers
      ];

      if (!records.length) {
        throw new Error(
          "No player statistics are loaded."
        );
      }

      button.disabled = true;
      button.textContent =
        "SAVING PLAYER SNAPSHOT...";

      status.textContent =
        `Saving ${records.length} pregame ` +
        `player records...`;

      let saved = 0;

      for (const record of records) {
        await postRecord(record);

        saved += 1;

        status.textContent =
          `Saving player records: ` +
          `${saved} of ${records.length}`;
      }

      status.textContent =
        `SAVED ${saved} PLAYER RECORDS — ` +
        `${matchup.awayCode} @ ` +
        `${matchup.homeCode}`;

      button.textContent =
        "PLAYER SNAPSHOT SAVED";

    } catch (error) {
      console.error(
        "Player snapshot error:",
        error
      );

      status.textContent =
        "SAVE FAILED: " + error.message;

      button.textContent =
        "SAVE PLAYER SNAPSHOT";

    } finally {
      button.disabled = false;
    }
  }

  function createPlayerRecordsPanel() {
    if (
      document.getElementById(
        "playerRecordsPanel"
      )
    ) {
      return;
    }

    const recordsPanel =
      document.getElementById(
        "recordsBookPanel"
      );

    if (!recordsPanel) {
      setTimeout(
        createPlayerRecordsPanel,
        250
      );

      return;
    }

    const panel =
      document.createElement("div");

    panel.className = "panel";
    panel.id = "playerRecordsPanel";

    panel.innerHTML = `
      <h2>Player Records Snapshot</h2>

      <p class="note">
        Save the complete pregame quarterback,
        receiver and rushing statistics currently
        displayed in Doc's NFL War Room.
      </p>

      <button
        id="savePlayerSnapshot"
        type="button"
      >
        SAVE PLAYER SNAPSHOT
      </button>

      <p
        id="playerSnapshotStatus"
        class="status"
      >
        No player snapshot saved yet.
      </p>
    `;

    recordsPanel.parentNode.insertBefore(
      panel,
      recordsPanel
    );

    document
      .getElementById(
        "savePlayerSnapshot"
      )
      .addEventListener(
        "click",
        savePlayerSnapshot
      );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createPlayerRecordsPanel
    );
  } else {
    createPlayerRecordsPanel();
  }

})();
