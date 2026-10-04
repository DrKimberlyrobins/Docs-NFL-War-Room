/* =========================================================
   DOC'S NFL WAR ROOM
   READABLE GAME RECORDS
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

  function getRows(bodyId) {
    const body = document.getElementById(bodyId);
    if (!body) return [];

    return Array.from(body.querySelectorAll("tr")).map(row =>
      Array.from(row.querySelectorAll("td")).map(cell =>
        clean(cell.textContent)
      )
    );
  }

  function findRow(bodyId, label) {
    const rows = getRows(bodyId);

    return rows.find(row =>
      clean(row[0]).toLowerCase() === label.toLowerCase()
    ) || [];
  }

  function value(bodyId, label, column) {
    const row = findRow(bodyId, label);
    return row[column] ?? "";
  }

  function getSportsbookRow(market, side) {
    const rows = getRows("oddsBody");

    return rows.find(row =>
      clean(row[0]).toLowerCase() === market.toLowerCase() &&
      clean(row[1]).toLowerCase() === side.toLowerCase()
    ) || [];
  }

  function buildGameRecord() {
    const awayName =
      document.getElementById("away")?.value || "";

    const homeName =
      document.getElementById("home")?.value || "";

    if (!awayName || !homeName || awayName === homeName) {
      throw new Error("Select two different teams before saving.");
    }

    const awayCode = teamCodes[awayName] || awayName;
    const homeCode = teamCodes[homeName] || homeName;

    const awaySpread =
      getSportsbookRow("Spread", awayCode);

    const homeSpread =
      getSportsbookRow("Spread", homeCode);

    const awayML =
      getSportsbookRow("Moneyline", awayCode);

    const homeML =
      getSportsbookRow("Moneyline", homeCode);

    const over =
      getSportsbookRow("Total", "Over");

    const under =
      getSportsbookRow("Total", "Under");

    return {
      type: "game",
      timestamp: "",

      matchup:
        `${awayCode} — ${awayName} @ ${homeCode} — ${homeName}`,

      awayTeam: awayName,
      awayCode: awayCode,
      homeTeam: homeName,
      homeCode: homeCode,

      /* ==============================
         EPA & SOS
         ============================== */

      awayOffEPA:
        value("epaBody", "Offensive EPA / Play", 1),

      homeOffEPA:
        value("epaBody", "Offensive EPA / Play", 2),

      awayDefEPAAllowed:
        value("epaBody", "Defensive EPA / Play Allowed", 1),

      homeDefEPAAllowed:
        value("epaBody", "Defensive EPA / Play Allowed", 2),

      awayPassEPA:
        value("epaBody", "Passing EPA / Play", 1),

      homePassEPA:
        value("epaBody", "Passing EPA / Play", 2),

      awayRushEPA:
        value("epaBody", "Rushing EPA / Play", 1),

      homeRushEPA:
        value("epaBody", "Rushing EPA / Play", 2),

      awayDefPassEPAAllowed:
        value("epaBody", "Defensive Passing EPA Allowed", 1),

      homeDefPassEPAAllowed:
        value("epaBody", "Defensive Passing EPA Allowed", 2),

      awayDefRushEPAAllowed:
        value("epaBody", "Defensive Rushing EPA Allowed", 1),

      homeDefRushEPAAllowed:
        value("epaBody", "Defensive Rushing EPA Allowed", 2),

      awaySOS:
        value("epaBody", "Offensive Strength of Schedule", 1) ||
        value("epaBody", "Strength of Schedule", 1),

      homeSOS:
        value("epaBody", "Offensive Strength of Schedule", 2) ||
        value("epaBody", "Strength of Schedule", 2),

      /* ==============================
         PROJECTED PLAYS
         ============================== */

      awayProjectedPlays:
        value("playsBody", "Projected Full-Game Plays", 1),

      homeProjectedPlays:
        value("playsBody", "Projected Full-Game Plays", 2),

      awayProjected1HPlays:
        value("playsBody", "Projected First-Half Plays", 1),

      homeProjected1HPlays:
        value("playsBody", "Projected First-Half Plays", 2),

      /* ==============================
         EPA CALCULATOR
         ============================== */

      awayMatchupEPA:
        value(
          "epaCalcBody",
          "Estimated Matchup EPA / Play",
          1
        ),

      homeMatchupEPA:
        value(
          "epaCalcBody",
          "Estimated Matchup EPA / Play",
          2
        ),

      awayEstimated1HTotalEPA:
        value(
          "epaCalcBody",
          "Estimated First-Half Total EPA",
          1
        ),

      homeEstimated1HTotalEPA:
        value(
          "epaCalcBody",
          "Estimated First-Half Total EPA",
          2
        ),

      awayEstimatedFullGameEPA:
        value(
          "epaCalcBody",
          "Estimated Full-Game Total EPA",
          1
        ),

      homeEstimatedFullGameEPA:
        value(
          "epaCalcBody",
          "Estimated Full-Game Total EPA",
          2
        ),

      /* ==============================
         SCORING ENGINE
         ============================== */

      away1QScore:
        value(
          "scoringBody",
          "First Quarter Estimated Score",
          1
        ),

      home1QScore:
        value(
          "scoringBody",
          "First Quarter Estimated Score",
          2
        ),

      estimated1QTotal:
        value(
          "scoringBody",
          "First Quarter Estimated Total",
          1
        ),

      firstQuarterEdge:
        value(
          "scoringBody",
          "First Quarter Estimated Margin",
          1
        ),

      away1HScore:
        value(
          "scoringBody",
          "First Half Estimated Score",
          1
        ),

      home1HScore:
        value(
          "scoringBody",
          "First Half Estimated Score",
          2
        ),

      estimated1HTotal:
        value(
          "scoringBody",
          "First Half Estimated Total",
          1
        ),

      firstHalfEdge:
        value(
          "scoringBody",
          "First Half Estimated Margin",
          1
        ),

      awayFullGameScore:
        value(
          "scoringBody",
          "Full Game Estimated Score",
          1
        ),

      homeFullGameScore:
        value(
          "scoringBody",
          "Full Game Estimated Score",
          2
        ),

      estimatedGameTotal:
        value(
          "scoringBody",
          "Full Game Estimated Total",
          1
        ),

      fullGameEdge:
        value(
          "scoringBody",
          "Full Game Estimated Margin",
          1
        ),

      /* ==============================
         DEFENSIVE MATCHUP
         ============================== */

      awayDefenseGames:
        getRows("defenseBody")[0]?.[1] || "",

      away20PlusAllowed:
        getRows("defenseBody")[0]?.[2] || "",

      away20PlusAllowedPerGame:
        getRows("defenseBody")[0]?.[3] || "",

      awayYACAllowed:
        getRows("defenseBody")[0]?.[4] || "",

      awayYACAllowedPerGame:
        getRows("defenseBody")[0]?.[5] || "",

      homeDefenseGames:
        getRows("defenseBody")[1]?.[1] || "",

      home20PlusAllowed:
        getRows("defenseBody")[1]?.[2] || "",

      home20PlusAllowedPerGame:
        getRows("defenseBody")[1]?.[3] || "",

      homeYACAllowed:
        getRows("defenseBody")[1]?.[4] || "",

      homeYACAllowedPerGame:
        getRows("defenseBody")[1]?.[5] || "",

      /* ==============================
         CBS SPORTSBOOK
         ============================== */

      awaySpreadOpen: awaySpread[2] || "",
      awaySpreadCurrent: awaySpread[3] || "",
      awaySpreadPublic: awaySpread[4] || "",
      awaySpreadMovement: awaySpread[5] || "",

      homeSpreadOpen: homeSpread[2] || "",
      homeSpreadCurrent: homeSpread[3] || "",
      homeSpreadPublic: homeSpread[4] || "",
      homeSpreadMovement: homeSpread[5] || "",

      awayMoneylineOpen: awayML[2] || "",
      awayMoneylineCurrent: awayML[3] || "",
      awayMoneylinePublic: awayML[4] || "",
      awayMoneylineMovement: awayML[5] || "",

      homeMoneylineOpen: homeML[2] || "",
      homeMoneylineCurrent: homeML[3] || "",
      homeMoneylinePublic: homeML[4] || "",
      homeMoneylineMovement: homeML[5] || "",

      totalOverOpen: over[2] || "",
      totalOverCurrent: over[3] || "",
      totalOverPublic: over[4] || "",
      totalOverMovement: over[5] || "",

      totalUnderOpen: under[2] || "",
      totalUnderCurrent: under[3] || "",
      totalUnderPublic: under[4] || "",
      totalUnderMovement: under[5] || ""
    };
  }

  async function saveGameRecord() {
    const button =
      document.getElementById("saveGameRecord");

    const status =
      document.getElementById("recordsBookStatus");

    try {
      button.disabled = true;
      button.textContent = "SAVING...";

      status.textContent =
        "Saving readable game record...";

      const record = buildGameRecord();

      const response = await fetch(RECORDS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(record)
      });

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error(
          result.message ||
          "Records Book did not confirm the save."
        );
      }

      status.textContent =
        `SAVED: ${record.matchup}`;

      button.textContent =
        "SAVED TO RECORDS BOOK";

    } catch (error) {
      console.error("Records Book error:", error);

      status.textContent =
        "SAVE FAILED: " + error.message;

      button.textContent =
        "SAVE TO RECORDS BOOK";

    } finally {
      button.disabled = false;
    }
  }

  function createRecordsBookPanel() {
    if (document.getElementById("recordsBookPanel")) {
      return;
    }

    const postgamePanel =
      Array.from(
        document.querySelectorAll(".panel")
      ).find(panel => {
        const heading = panel.querySelector("h2");

        return heading &&
          clean(heading.textContent) ===
          "Postgame Evaluation";
      });

    if (!postgamePanel) {
      console.error(
        "Records Book could not find Postgame Evaluation."
      );
      return;
    }

    const panel = document.createElement("div");

    panel.className = "panel";
    panel.id = "recordsBookPanel";

    panel.innerHTML = `
      <h2>War Room Records Book</h2>

      <p class="note">
        Save a readable pregame snapshot of the
        current War Room analysis.
      </p>

      <button id="saveGameRecord" type="button">
        SAVE TO RECORDS BOOK
      </button>

      <p id="recordsBookStatus" class="status">
        No game saved yet.
      </p>
    `;

    postgamePanel.parentNode.insertBefore(
      panel,
      postgamePanel
    );

    document
      .getElementById("saveGameRecord")
      .addEventListener(
        "click",
        saveGameRecord
      );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createRecordsBookPanel
    );
  } else {
    createRecordsBookPanel();
  }

})();
