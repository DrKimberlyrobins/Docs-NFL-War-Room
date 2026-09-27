
// DOC'S NFL WAR ROOM
// 1Q, 1H AND FULL-GAME SCORING CALCULATOR

let scoringData = null;

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

function addScoringRow(label, away, home) {
  const row = document.createElement("tr");

  [label, away, home].forEach(value => {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });

  document.getElementById("scoringBody")
    .appendChild(row);
}

function calculatePeriod(away, home, scored, allowed) {
  return {
    away: (away[scored] + home[allowed]) / 2,
    home: (home[scored] + away[allowed]) / 2
  };
}

function renderScoring() {
  const awayName =
    document.getElementById("away").value;

  const homeName =
    document.getElementById("home").value;

  const body =
    document.getElementById("scoringBody");

  const status =
    document.getElementById("scoringStatus");

  body.replaceChildren();

  document.getElementById("scoreAwayHeader")
    .textContent = awayName;

  document.getElementById("scoreHomeHeader")
    .textContent = homeName;

  if (awayName === homeName) {
    status.textContent =
      "Please select two different teams.";
    return;
  }

  if (!scoringData) {
    status.textContent =
      "Scoring data is not available yet.";
    return;
  }

  const away =
    scoringData.teams[teamCodes[awayName]];

  const home =
    scoringData.teams[teamCodes[homeName]];

  if (!away || !home) {
    status.textContent =
      "Verified scoring data is missing.";
    return;
  }

  const periods = [
    [
      "First Quarter",
      "firstQuarterPointsScored",
      "firstQuarterPointsAllowed"
    ],
    [
      "First Half",
      "firstHalfPointsScored",
      "firstHalfPointsAllowed"
    ],
    [
      "Full Game",
      "finalPointsScored",
      "finalPointsAllowed"
    ]
  ];

  for (const [label, scored, allowed] of periods) {

    const values = [
      away[scored],
      away[allowed],
      home[scored],
      home[allowed]
    ];

    if (!values.every(Number.isFinite)) {
      addScoringRow(label, "—", "—");
      continue;
    }

    const prediction =
      calculatePeriod(away, home, scored, allowed);

    const awayPoints = prediction.away;
    const homePoints = prediction.home;

    addScoringRow(
      label + " Estimated Score",
      awayPoints.toFixed(1),
      homePoints.toFixed(1)
    );

    addScoringRow(
      label + " Estimated Total",
      (awayPoints + homePoints).toFixed(1),
      (awayPoints + homePoints).toFixed(1)
    );

    const margin =
      Math.abs(awayPoints - homePoints);

    const leader =
      awayPoints > homePoints
        ? awayName
        : homePoints > awayPoints
          ? homeName
          : "Tie";

    addScoringRow(
      label + " Estimated Margin",
      leader === "Tie"
        ? "Tie"
        : leader + " by " + margin.toFixed(1),
      "—"
    );
  }

  status.textContent =
    "Based on " + away.games +
    " completed games for " + awayName +
    " and " + home.games +
    " for " + homeName +
    ". Preliminary estimates; no injury, " +
    "SOS or home-field adjustments.";
}

async function loadScoring() {
  try {
    const response = await fetch(
      "data/scoring-2026.json"
    );

    if (!response.ok) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    scoringData = await response.json();
    renderScoring();

  } catch (error) {
    document.getElementById("scoringStatus")
      .textContent =
      "Unable to load scoring data: " +
      error.message;
  }
}

// Run whenever the existing Analyze button is clicked.
const originalAnalyze = analyze;

analyze = function () {
  originalAnalyze();
  renderScoring();
};

loadScoring();
