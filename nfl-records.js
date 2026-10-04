/* =========================================================
   DOC'S NFL WAR ROOM
   RECORDS BOOK
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

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getElementText(id) {
    const element = document.getElementById(id);
    return element ? cleanText(element.textContent) : "";
  }

  function tableToArray(bodyId) {
    const body = document.getElementById(bodyId);

    if (!body) {
      return [];
    }

    return Array.from(body.querySelectorAll("tr")).map(row => {
      return Array.from(row.querySelectorAll("th, td")).map(cell =>
        cleanText(cell.textContent)
      );
    });
  }

  function getQBInfo(id) {
    return getElementText(id);
  }

  function buildGameRecord() {
    const awaySelect = document.getElementById("away");
    const homeSelect = document.getElementById("home");

    if (!awaySelect || !homeSelect) {
      throw new Error("Team selectors were not found.");
    }

    const awayName = awaySelect.value;
    const homeName = homeSelect.value;

    if (!awayName || !homeName || awayName === homeName) {
      throw new Error("Select two different teams before saving.");
    }

    const awayCode = teamCodes[awayName] || "";
    const homeCode = teamCodes[homeName] || "";

    const matchup =
      `${awayCode} — ${awayName} @ ${homeCode} — ${homeName}`;

    return {
      type: "game",

      timestamp: "",

      matchup: matchup,

      awayTeam: awayName,
      awayCode: awayCode,

      homeTeam: homeName,
      homeCode: homeCode,

      epaAndSOS: tableToArray("epaBody"),

      projectedOffensivePlays: tableToArray("playsBody"),

      epaProjectionCalculator: tableToArray("epaCalcBody"),

      scoringPredictionEngine: tableToArray("scoringBody"),

      awayQB: getQBInfo("qbAwayInfo"),

      homeQB: getQBInfo("qbHomeInfo"),

      receiverIntelligence: tableToArray("targetBody"),

      qbPassingIntelligence: tableToArray("qbPassingBody"),

      runningBackIntelligence: tableToArray("rushingBody"),

      defensiveMatchupIntelligence: tableToArray("defenseBody"),

      sportsbookResearch: tableToArray("oddsBody"),

      epaStatus: getElementText("epaCalcStatus"),

      playsStatus: getElementText("playsStatus"),

      scoringStatus: getElementText("scoringStatus"),

      playerStatus: getElementText("playerStatus"),

      qbPassingStatus: getElementText("qbPassingStatus"),

      rushingStatus: getElementText("rushingStatus"),

      defenseStatus: getElementText("defenseStatus")
    };
  }

  async function saveGameRecord() {
    const button = document.getElementById("saveGameRecord");
    const status = document.getElementById("recordsBookStatus");

    try {
      button.disabled = true;
      button.textContent = "SAVING...";

      status.textContent =
        "Saving pregame War Room snapshot...";

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
          result.message || "The Records Book did not confirm the save."
        );
      }

      status.textContent =
        `SAVED: ${record.matchup}`;

      button.textContent = "SAVED TO RECORDS BOOK";

    } catch (error) {
      console.error("Records Book error:", error);

      status.textContent =
        "SAVE FAILED: " + error.message;

      button.textContent = "SAVE TO RECORDS BOOK";

    } finally {
      button.disabled = false;
    }
  }

  function createRecordsBookPanel() {
    if (document.getElementById("recordsBookPanel")) {
      return;
    }

    const postgamePanel = Array.from(
      document.querySelectorAll(".panel")
    ).find(panel => {
      const heading = panel.querySelector("h2");

      return heading &&
        cleanText(heading.textContent) === "Postgame Evaluation";
    });

    if (!postgamePanel) {
      console.error(
        "Records Book could not find the Postgame Evaluation panel."
      );
      return;
    }

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.id = "recordsBookPanel";

    panel.innerHTML = `
      <h2>War Room Records Book</h2>

      <p class="note">
        Save the current pregame War Room analysis before kickoff.
        The saved record keeps the matchup and the data currently
        displayed in the War Room for later postgame evaluation.
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
      .addEventListener("click", saveGameRecord);
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
