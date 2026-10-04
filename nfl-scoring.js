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


// =========================================
// GREEN ADVANTAGE THRESHOLDS
// Green means a meaningful model advantage.
// It does NOT automatically mean "bet."
// =========================================

const scoringThresholds = {
  "First Quarter": 1.0,
  "First Half": 2.0,
  "Full Game": 3.0
};


// =========================================
// CREATE SCORING ROW
// =========================================

function addScoringRow(
  label,
  away,
  home,
  options = {}
) {

  const row = document.createElement("tr");

  const labelCell = document.createElement("td");
  const awayCell = document.createElement("td");
  const homeCell = document.createElement("td");

  labelCell.textContent = label;
  awayCell.textContent = away;
  homeCell.textContent = home;

  row.appendChild(labelCell);
  row.appendChild(awayCell);
  row.appendChild(homeCell);

  // Green the favored TEAM SCORE only when
  // the projected margin clears the threshold.
  if (options.highlight === "away") {
    awayCell.style.background =
      "rgba(53, 223, 147, 0.22)";
    awayCell.style.color = "#7cf5ba";
    awayCell.style.fontWeight = "900";
    awayCell.style.boxShadow =
      "inset 0 0 0 2px #35df93";
  }

  if (options.highlight === "home") {
    homeCell.style.background =
      "rgba(53, 223, 147, 0.22)";
    homeCell.style.color = "#7cf5ba";
    homeCell.style.fontWeight = "900";
    homeCell.style.boxShadow =
      "inset 0 0 0 2px #35df93";
  }

  // Margin is displayed in the away-side column.
  // Highlight it only when the advantage is meaningful.
  if (options.highlightMargin) {
    awayCell.style.background =
      "rgba(53, 223, 147, 0.22)";
    awayCell.style.color = "#7cf5ba";
    awayCell.style.fontWeight = "900";
    awayCell.style.boxShadow =
      "inset 0 0 0 2px #35df93";
  }

  document.getElementById("scoringBody")
    .appendChild(row);
}


// =========================================
// CALCULATE PERIOD
// =========================================

function calculatePeriod(
  away,
  home,
  scored,
  allowed
) {

  return {
    away:
      (away[scored] + home[allowed]) / 2,

    home:
      (home[scored] + away[allowed]) / 2
  };
}


// =========================================
// RENDER SCORING ENGINE
// =========================================

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


  for (
    const [label, scored, allowed]
    of periods
  ) {

    const values = [
      away[scored],
      away[allowed],
      home[scored],
      home[allowed]
    ];

    if (!values.every(Number.isFinite)) {
      addScoringRow(
        label,
        "—",
        "—"
      );
      continue;
    }


    const prediction =
      calculatePeriod(
        away,
        home,
        scored,
        allowed
      );


    const awayPoints =
      prediction.away;

    const homePoints =
      prediction.home;


    const margin =
      Math.abs(
        awayPoints - homePoints
      );


    const threshold =
      scoringThresholds[label];


    let leader = "Tie";
    let highlight = null;


    if (awayPoints > homePoints) {

      leader = awayName;

      if (margin >= threshold) {
        highlight = "away";
      }

    } else if (homePoints > awayPoints) {

      leader = homeName;

      if (margin >= threshold) {
        highlight = "home";
      }

    }


    // =====================================
    // ESTIMATED SCORE
    // =====================================

    addScoringRow(
      label + " Estimated Score",
      awayPoints.toFixed(1),
      homePoints.toFixed(1),
      {
        highlight: highlight
      }
    );


    // =====================================
    // ESTIMATED TOTAL
    // Totals remain neutral.
    // =====================================

    addScoringRow(
      label + " Estimated Total",
      (
        awayPoints +
        homePoints
      ).toFixed(1),

      (
        awayPoints +
        homePoints
      ).toFixed(1)
    );


    // =====================================
    // ESTIMATED MARGIN
    // =====================================

    addScoringRow(
      label + " Estimated Margin",

      leader === "Tie"
        ? "Tie"
        : leader +
          " by " +
          margin.toFixed(1),

      "—",

      {
        highlightMargin:
          leader !== "Tie" &&
          margin >= threshold
      }
    );

  }


  status.textContent =
    "Based on " +
    away.games +
    " completed games for " +
    awayName +
    " and " +
    home.games +
    " for " +
    homeName +
    ". Preliminary estimates; no injury, " +
    "SOS or home-field adjustments.";
}


// =========================================
// LOAD VERIFIED SCORING DATA
// =========================================

async function loadScoring() {

  try {

    const response =
      await fetch(
        "data/scoring-2026.json"
      );


    if (!response.ok) {

      throw new Error(
        "HTTP " +
        response.status
      );

    }


    scoringData =
      await response.json();


    renderScoring();


  } catch (error) {

    document
      .getElementById(
        "scoringStatus"
      )
      .textContent =
        "Unable to load scoring data: " +
        error.message;

  }

}


// =========================================
// RUN WHEN ANALYZE MATCHUP IS CLICKED
// =========================================

const originalAnalyze = analyze;


analyze = function () {

  originalAnalyze();

  renderScoring();

};


// =========================================
// START SCORING ENGINE
// =========================================

loadScoring();
