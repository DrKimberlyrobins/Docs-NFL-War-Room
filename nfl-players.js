
// DOC'S NFL WAR ROOM
// QB & RECEIVER INTELLIGENCE

let playerData = null;

const playerTeamCodes = {
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

function displayQuarterbacks(team, elementId) {
  const element = document.getElementById(elementId);
  element.replaceChildren();

  if (!team || !team.quarterbacks?.length) {
    element.textContent = "No quarterback data available.";
    return;
  }

  team.quarterbacks.forEach(qb => {
    const line = document.createElement("p");

    line.textContent =
      qb.name +
      " | Attempts: " + qb.attempts +
      " | Completions: " + qb.completions +
      " | Completion: " + qb.completionRate + "%" +
      " | Attempts/Game: " + qb.attemptsPerTeamGame;

    element.appendChild(line);
  });
}

function renderPlayers() {
  const awayName = document.getElementById("away").value;
  const homeName = document.getElementById("home").value;

  const body = document.getElementById("targetBody");
  const status = document.getElementById("playerStatus");

  body.replaceChildren();

  document.getElementById("qbAwayHeader")
    .textContent = awayName + " Quarterbacks";

  document.getElementById("qbHomeHeader")
    .textContent = homeName + " Quarterbacks";

  if (awayName === homeName) {
    status.textContent = "Select two different teams.";
    return;
  }

  if (!playerData) {
    status.textContent = "Loading player statistics...";
    return;
  }

  const away =
    playerData.teams[playerTeamCodes[awayName]];

  const home =
    playerData.teams[playerTeamCodes[homeName]];

  displayQuarterbacks(away, "qbAwayInfo");
  displayQuarterbacks(home, "qbHomeInfo");

  const columns = [
  "targets",
  "targetsPerGame",
  "receptions",
  "receivingYards",
  "yardsPerGame",
  "yardsAfterCatch",
  "yacPerReception",
  "catchRate",
  "redZoneTargets",
  "inside10Targets",
  "receivingTouchdowns"
];

  const receivers = [
    ...(away?.receivers || []).map(player => ({
      team: awayName,
      player
    })),
    ...(home?.receivers || []).map(player => ({
      team: homeName,
      player
    }))
  ];

  if (!receivers.length) {
    status.textContent = "No receiver data available.";
    return;
  }

  const leaders = {};

  columns.forEach(key => {
    leaders[key] = Math.max(
      ...receivers.map(item =>
        Number(item.player[key]) || 0
      )
    );
  });

  receivers.sort(
    (a, b) => b.player.targets - a.player.targets
  );

  receivers.forEach(item => {
    const row = document.createElement("tr");

    const values = [
      item.team,
      item.player.name,
      ...columns.map(key => item.player[key])
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value ?? "—";

      if (index >= 2) {
        const key = columns[index - 2];

        if (
          Number.isFinite(value) &&
          value > 0 &&
          value === leaders[key]
        ) {
          cell.style.color = "#35df93";
          cell.style.fontWeight = "bold";
        }
      }

      row.appendChild(cell);
    });

    body.appendChild(row);
  });

  status.textContent =
    "Away team games: " + (away?.games ?? 0) +
    " | Home team games: " + (home?.games ?? 0) +
    ". Green highlights the highest recorded " +
    "number in each column, not a betting edge.";
}

async function loadPlayers() {
  try {
    const response = await fetch(
      "data/players-2026.json"
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    playerData = await response.json();
    renderPlayers();

  } catch (error) {
    document.getElementById("playerStatus")
      .textContent =
      "Unable to load player data: " +
      error.message;
  }
}

// Connect to our existing Analyze Matchup button.
const previousPlayerAnalyze = analyze;

analyze = function () {
  previousPlayerAnalyze();
  renderPlayers();
};

loadPlayers();


// QB PASSING INTELLIGENCE

function renderQBPassing() {
  const body = document.getElementById("qbPassingBody");
  const status = document.getElementById("qbPassingStatus");

  if (!body || !status || !playerData) return;

  body.replaceChildren();

  const selectedTeams = [
    document.getElementById("away").value,
    document.getElementById("home").value
  ];

  selectedTeams.forEach(teamName => {
    const code = playerTeamCodes[teamName];
    const team = playerData.teams[code];

    if (!team) return;

    team.quarterbacks.forEach(qb => {
      const row = document.createElement("tr");

      [
  teamName,
  qb.name,
  qb.attempts,
  qb.completions,
  qb.completionRate + "%",
  qb.attemptsPerTeamGame,
  qb.passingYards,
  qb.yardsPerAttempt,
  qb.passingTDs,
  qb.interceptions
].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      body.appendChild(row);
    });
  });

  status.textContent =
    "Verified passing statistics from completed games.";
}

// Connect the new table to the existing functions.
const previousRenderPlayers = renderPlayers;

renderPlayers = function () {
  previousRenderPlayers();
  renderQBPassing();
};

