
 // DOC'S NFL WAR ROOM
 // QB, RECEIVER, DEFENSE & RUNNING BACK INTELLIGENCE
 // UPGRADE: QB PASSING COMPLETIONS INTELLIGENCE

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

function validNumber(value) {
  return typeof value === "number" &&
    Number.isFinite(value);
}

function fixedNumber(value, digits = 2) {
  return validNumber(value)
    ? value.toFixed(digits)
    : "N/A";
}

// Uses team games as the denominator.
// These are team-game averages, not necessarily
// games personally played by the quarterback.
function calculateQBCompletions(qb, team) {
  const attempts = Number(qb?.attempts);
  const completions = Number(qb?.completions);
  const games = Number(team?.games);

  const validAttempts =
    Number.isFinite(attempts) && attempts >= 0;

  const validCompletions =
    Number.isFinite(completions) &&
    completions >= 0;

  const validGames =
    Number.isFinite(games) && games > 0;

  const attemptsPerGame =
    validAttempts && validGames
      ? attempts / games
      : null;

  const completionsPerGame =
    validCompletions && validGames
      ? completions / games
      : null;

  const completionRate =
    validAttempts &&
    validCompletions &&
    attempts > 0 &&
    completions <= attempts
      ? completions / attempts
      : null;

  const estimatedCompletions =
    validNumber(attemptsPerGame) &&
    validNumber(completionRate)
      ? attemptsPerGame * completionRate
      : null;

  return {
    attempts: validAttempts ? attempts : null,
    completions:
      validCompletions ? completions : null,
    games: validGames ? games : null,
    attemptsPerGame,
    completionsPerGame,
    completionRate,
    estimatedCompletions
  };
}

// Available for our separate player-popout upgrade.
window.docsCalculateQBCompletions =
  calculateQBCompletions;

function displayQuarterbacks(team, elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.replaceChildren();

  if (!team || !team.quarterbacks?.length) {
    element.textContent =
      "No quarterback data available.";
    return;
  }

  team.quarterbacks.forEach(qb => {
    const stats = calculateQBCompletions(qb, team);
    const line = document.createElement("p");

    line.textContent =
      qb.name +
      " | Attempts: " + qb.attempts +
      " | Completions: " + qb.completions +
      " | Completion: " +
        (validNumber(stats.completionRate)
          ? fixedNumber(
              stats.completionRate * 100,
              1
            ) + "%"
          : "N/A") +
      " | Attempts/Game: " +
        fixedNumber(stats.attemptsPerGame) +
      " | Completions/Game: " +
        fixedNumber(stats.completionsPerGame);

    element.appendChild(line);
  });
}

function renderPlayers() {
  const awayName =
    document.getElementById("away")?.value;

  const homeName =
    document.getElementById("home")?.value;

  const body =
    document.getElementById("targetBody");

  const status =
    document.getElementById("playerStatus");

  if (!body || !status) return;

  body.replaceChildren();

  const awayHeader =
    document.getElementById("qbAwayHeader");

  const homeHeader =
    document.getElementById("qbHomeHeader");

  if (awayHeader) {
    awayHeader.textContent =
      awayName + " Quarterbacks";
  }

  if (homeHeader) {
    homeHeader.textContent =
      homeName + " Quarterbacks";
  }

  if (awayName === homeName) {
    status.textContent =
      "Select two different teams.";
    return;
  }

  if (!playerData) {
    status.textContent =
      "Loading player statistics...";
    return;
  }

  const away =
    playerData.teams?.[
      playerTeamCodes[awayName]
    ];

  const home =
    playerData.teams?.[
      playerTeamCodes[homeName]
    ];

  displayQuarterbacks(
    away,
    "qbAwayInfo"
  );

  displayQuarterbacks(
    home,
    "qbHomeInfo"
  );

  const columns = [
    "targets",
    "targetsPerGame",
    "receptions",
    "receivingYards",
    "yardsPerGame",
    "yardsAfterCatch",
    "yacPerReception",
    "explosiveReceptions",
    "explosiveRate",
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
    status.textContent =
      "No receiver data available.";
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
    (a, b) =>
      (b.player.targets || 0) -
      (a.player.targets || 0)
  );

  receivers.forEach(item => {
    const row = document.createElement("tr");

    const values = [
      item.team,
      item.player.name,
      ...columns.map(
        key => item.player[key]
      )
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
    "Away team games: " +
    (away?.games ?? 0) +
    " | Home team games: " +
    (home?.games ?? 0) +
    ". Green highlights the highest recorded " +
    "number in each column, not a betting edge.";
}

// QB PASSING INTELLIGENCE

function getQBCompletionPanel() {
  let panel = document.getElementById(
    "docsQBCompletionAnalysis"
  );

  if (panel) return panel;

  const anchor = document.getElementById(
    "qbPassingStatus"
  );

  if (!anchor) return null;

  panel = document.createElement("div");
  panel.id = "docsQBCompletionAnalysis";

  Object.assign(panel.style, {
    marginTop: "18px",
    padding: "16px",
    background: "#14283c",
    color: "#f1f5f9",
    border: "1px solid #36516b",
    borderRadius: "10px"
  });

  anchor.insertAdjacentElement(
    "afterend",
    panel
  );

  return panel;
}

function renderQBCompletionAnalysis(selectedTeams) {
  const panel = getQBCompletionPanel();
  if (!panel) return;

  panel.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent =
    "QB PASSING COMPLETIONS INTELLIGENCE";
  panel.appendChild(heading);

  selectedTeams.forEach(teamName => {
    const code = playerTeamCodes[teamName];
    const team = playerData?.teams?.[code];

    if (!team?.quarterbacks?.length) return;

    team.quarterbacks.forEach(qb => {
      const stats =
        calculateQBCompletions(qb, team);

      const card = document.createElement("div");

      Object.assign(card.style, {
        padding: "14px",
        marginTop: "12px",
        borderRadius: "8px",
        background: "#20374c"
      });

      const name = document.createElement("h4");
      name.textContent =
        qb.name + " — " + teamName;
      card.appendChild(name);

      const addLine = (label, value) => {
        const p = document.createElement("p");
        p.style.margin = "6px 0";

        const strong =
          document.createElement("strong");

        strong.textContent = label + ": ";

        p.appendChild(strong);
        p.appendChild(
          document.createTextNode(value)
        );

        card.appendChild(p);
      };

      addLine(
        "Total passing attempts",
        String(stats.attempts ?? "N/A")
      );

      addLine(
        "Total passing completions",
        String(stats.completions ?? "N/A")
      );

      addLine(
        "Team games",
        String(stats.games ?? "N/A")
      );

      addLine(
        "Attempts per game",
        stats.games
          ? stats.attempts + " ÷ " +
            stats.games + " = " +
            fixedNumber(stats.attemptsPerGame)
          : "N/A"
      );

      addLine(
        "Completions per game",
        stats.games
          ? stats.completions + " ÷ " +
            stats.games + " = " +
            fixedNumber(stats.completionsPerGame)
          : "N/A"
      );

      addLine(
        "Completion percentage",
        stats.attempts > 0
          ? stats.completions + " ÷ " +
            stats.attempts + " × 100 = " +
            fixedNumber(
              stats.completionRate * 100,
              2
            ) + "%"
          : "N/A"
      );

      addLine(
        "Estimated completions at current rate",
        validNumber(stats.estimatedCompletions)
          ? fixedNumber(stats.attemptsPerGame) +
            " × " +
            fixedNumber(
              stats.completionRate * 100,
              2
            ) + "% = " +
            fixedNumber(stats.estimatedCompletions)
          : "N/A"
      );

      const note = document.createElement("p");
      note.style.fontSize = "12px";
      note.style.color = "#cbd5e1";
      note.textContent =
        "These are historical team-game averages. " +
        "The estimated completions figure uses " +
        "the same historical attempts and completion " +
        "rate, so it equals the historical completions " +
        "per game. It is not an independent matchup " +
        "projection or a qualified betting edge.";

      card.appendChild(note);
      panel.appendChild(card);
    });
  });
}

function renderQBPassing() {
  const body =
    document.getElementById("qbPassingBody");

  const status =
    document.getElementById("qbPassingStatus");

  if (!body || !status || !playerData) return;

  body.replaceChildren();

  const selectedTeams = [
    document.getElementById("away")?.value,
    document.getElementById("home")?.value
  ];

  selectedTeams.forEach(teamName => {
    const code = playerTeamCodes[teamName];
    const team = playerData.teams?.[code];

    if (!team?.quarterbacks) return;

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
        cell.textContent = value ?? "—";
        row.appendChild(cell);
      });

      body.appendChild(row);
    });
  });

  status.textContent =
    "Verified passing statistics from completed games.";

  renderQBCompletionAnalysis(selectedTeams);
}

// DEFENSIVE MATCHUP INTELLIGENCE

function renderDefense() {
  const body =
    document.getElementById("defenseBody");

  const status =
    document.getElementById("defenseStatus");

  if (!body || !status || !playerData) return;

  body.replaceChildren();

  const selectedTeams = [
    document.getElementById("away")?.value,
    document.getElementById("home")?.value
  ];

  selectedTeams.forEach(teamName => {
    const code = playerTeamCodes[teamName];

    const defense =
      playerData.teams?.[code]?.defense;

    if (!defense || !defense.games) return;

    const values = [
      teamName,
      defense.games,
      defense.explosiveReceptionsAllowed,
      defense.explosiveReceptionsAllowedPerGame,
      defense.yardsAfterCatchAllowed,
      defense.yardsAfterCatchAllowedPerGame
    ];

    const row = document.createElement("tr");

    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value ?? "—";
      row.appendChild(cell);
    });

    body.appendChild(row);
  });

  status.textContent = body.children.length
    ? "Defensive statistics from completed games."
    : "No defensive statistics available.";
}

// RUNNING BACK INTELLIGENCE

function renderRushing() {
  const body =
    document.getElementById("rushingBody");

  const status =
    document.getElementById("rushingStatus");

  if (!body || !status) return;

  body.replaceChildren();

  if (!playerData) {
    status.textContent =
      "Waiting for rushing data...";
    return;
  }

  const selectedTeams = [
    document.getElementById("away")?.value,
    document.getElementById("home")?.value
  ];

  const rushers = [];

  selectedTeams.forEach(teamName => {
    const code = playerTeamCodes[teamName];
    const team = playerData.teams?.[code];

    (team?.rushers || []).forEach(player => {
      rushers.push({
        teamName,
        player
      });
    });
  });

  if (!rushers.length) {
    status.textContent =
      "No rushing data available.";
    return;
  }

  const columns = [
    "games",
    "carries",
    "carriesPerGame",
    "rushingYards",
    "rushingYardsPerGame",
    "yardsPerCarry",
    "rushingTouchdowns",
    "redZoneCarries",
    "inside10Carries"
  ];

  const leaders = {};

  columns.forEach(key => {
    leaders[key] = Math.max(
      ...rushers.map(item =>
        Number(item.player[key]) || 0
      )
    );
  });

  rushers.sort(
    (a, b) =>
      (b.player.carries || 0) -
      (a.player.carries || 0)
  );

  rushers.forEach(item => {
    const row = document.createElement("tr");

    const values = [
      item.teamName,
      item.player.name,
      ...columns.map(
        key => item.player[key]
      )
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
    "Rushing statistics from completed games. " +
    "Green identifies the highest recorded value " +
    "in each column, not a betting recommendation.";
}

// PRESERVE EXISTING MATCHUP ANALYSIS CHAIN

const previousPlayerAnalyze =
  window.analyze;

window.analyze = function (...args) {
  if (typeof previousPlayerAnalyze === "function") {
    previousPlayerAnalyze.apply(this, args);
  }

  renderPlayers();
  renderQBPassing();
  renderDefense();
  renderRushing();
};

// LOAD VERIFIED PLAYER DATA

async function loadPlayers() {
  try {
    const response = await fetch(
      "data/players-2026.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    playerData = await response.json();

    renderPlayers();
    renderQBPassing();
    renderDefense();
    renderRushing();

  } catch (error) {
    console.error(error);

    const status =
      document.getElementById("playerStatus");

    if (status) {
      status.textContent =
        "Unable to load player data: " +
        error.message;
    }
  }
}

loadPlayers();
