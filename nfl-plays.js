
/* DOC'S NFL WAR ROOM
   Projected Offensive Plays
   Source: Our nflverse play-count data
*/

(() => {
  "use strict";

  const DATA_URL = "data/plays-2026.json";

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

  let playsData = null;

  function valid(number) {
    return typeof number === "number" &&
           Number.isFinite(number);
  }

  function average(a, b) {
    if (!valid(a) || !valid(b)) return null;
    return (a + b) / 2;
  }

  function display(number) {
    return valid(number)
      ? number.toFixed(1)
      : "N/A";
  }

  function addRow(body, label, away, home) {
    const row = document.createElement("tr");

    [label, display(away), display(home)]
      .forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;

        // Highlight higher values only.
        // Higher play volume is not automatically
        // a betting advantage.
        if (
          index > 0 &&
          valid(away) &&
          valid(home) &&
          away !== home &&
          ((index === 1 && away > home) ||
           (index === 2 && home > away))
        ) {
          cell.style.backgroundColor = "#176b46";
          cell.style.color = "#ffffff";
          cell.style.fontWeight = "bold";
        }

        row.appendChild(cell);
      });

    body.appendChild(row);
  }

  function renderPlays() {
    const body = document.getElementById("playsBody");
    const status = document.getElementById("playsStatus");

    const awayName =
      document.getElementById("away")?.value;

    const homeName =
      document.getElementById("home")?.value;

    if (!body || !awayName || !homeName) return;

    document.getElementById(
      "playsAwayHeader"
    ).textContent = awayName;

    document.getElementById(
      "playsHomeHeader"
    ).textContent = homeName;

    body.replaceChildren();

    if (!playsData) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 3;
      cell.textContent = "Loading play statistics...";
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    const away =
      playsData.teams?.[teamCodes[awayName]];

    const home =
      playsData.teams?.[teamCodes[homeName]];

    if (!away || !home) {
      addRow(body, "Statistics unavailable", null, null);
      return;
    }

    const awayProjected = average(
      away.offensivePlaysPerGame,
      home.opponentPlaysPerGame
    );

    const homeProjected = average(
      home.offensivePlaysPerGame,
      away.opponentPlaysPerGame
    );

    const awayFirstHalf = average(
      away.firstHalfOffensivePlays,
      home.firstHalfOpponentPlays
    );

    const homeFirstHalf = average(
      home.firstHalfOffensivePlays,
      away.firstHalfOpponentPlays
    );

    addRow(
      body,
      "Offensive Plays / Game",
      away.offensivePlaysPerGame,
      home.offensivePlaysPerGame
    );

    addRow(
      body,
      "Opponent Plays Allowed / Game",
      home.opponentPlaysPerGame,
      away.opponentPlaysPerGame
    );

    addRow(
      body,
      "Projected Full-Game Plays",
      awayProjected,
      homeProjected
    );

    addRow(
      body,
      "Projected First-Half Plays",
      awayFirstHalf,
      homeFirstHalf
    );

    addRow(
      body,
      "Projected Full-Game Range (±5)",
      null,
      null
    );

    const lastRow = body.lastElementChild;

    if (valid(awayProjected)) {
      lastRow.children[1].textContent =
        display(awayProjected - 5) +
        "–" +
        display(awayProjected + 5);
    }

    if (valid(homeProjected)) {
      lastRow.children[2].textContent =
        display(homeProjected - 5) +
        "–" +
        display(homeProjected + 5);
    }

    if (status) {
      status.textContent =
        "Source: nflverse | " +
        "EPA-eligible pass/rush plays | " +
        "Projection: average of team pace " +
        "and opponent plays allowed. " +
        "The ±5 range is illustrative, " +
        "not a statistical confidence interval.";
    }
  }

  const previousAnalyze = window.analyze;

  window.analyze = function () {
    if (typeof previousAnalyze === "function") {
      previousAnalyze();
    }

    renderPlays();
  };

  fetch(DATA_URL, { cache: "no-store" })
    .then(response => {
      if (!response.ok) {
        throw new Error("Play data unavailable");
      }
      return response.json();
    })
    .then(data => {
      playsData = data;
      renderPlays();
    })
    .catch(error => {
      console.error(error);

      const status =
        document.getElementById("playsStatus");

      if (status) {
        status.textContent =
          "Unable to load play statistics.";
      }
    });

  renderPlays();
})();

