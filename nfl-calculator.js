
// DOC'S NFL WAR ROOM
// EPA PROJECTION CALCULATOR

(() => {
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

  let epaData = null;
  let playsData = null;

  function number(value) {
    return typeof value === "number" &&
      Number.isFinite(value);
  }

  function format(value) {
    return number(value) ? value.toFixed(2) : "N/A";
  }

  function average(a, b) {
    return number(a) && number(b)
      ? (a + b) / 2
      : null;
  }

  function calculate(team, opponent) {
    if (!team || !opponent) return null;

    // Simple illustrative matchup EPA per play.
    const matchupEPA = average(
      team.epa.offensiveEPA,
      opponent.epa.defensiveEPAAllowed
    );

    // Projected plays using team pace
    // and the opponent's plays allowed.
    const fullPlays = average(
      team.plays.offensivePlaysPerGame,
      opponent.plays.opponentPlaysPerGame
    );

    const halfPlays = average(
      team.plays.firstHalfOffensivePlays,
      opponent.plays.firstHalfOpponentPlays
    );

    return {
      offensiveEPA: team.epa.offensiveEPA,
      opponentDefense:
        opponent.epa.defensiveEPAAllowed,
      matchupEPA,
      fullPlays,
      halfPlays,
      fullEPA: number(matchupEPA) &&
        number(fullPlays)
          ? matchupEPA * fullPlays
          : null,
      halfEPA: number(matchupEPA) &&
        number(halfPlays)
          ? matchupEPA * halfPlays
          : null
    };
  }

  function render() {
    const body =
      document.getElementById("epaCalcBody");

    if (!body) return;

    const awayName =
      document.getElementById("away")?.value;

    const homeName =
      document.getElementById("home")?.value;

    const status =
      document.getElementById("epaCalcStatus");

    if (!epaData || !playsData) {
      if (status) {
        status.textContent =
          "Loading EPA calculator data...";
      }
      return;
    }

    const awayCode = teamCodes[awayName];
    const homeCode = teamCodes[homeName];

    const away = {
      epa: epaData.teams?.[awayCode],
      plays: playsData.teams?.[awayCode]
    };

    const home = {
      epa: epaData.teams?.[homeCode],
      plays: playsData.teams?.[homeCode]
    };

    if (
      !away.epa || !away.plays ||
      !home.epa || !home.plays
    ) {
      if (status) {
        status.textContent =
          "Statistics unavailable for this matchup.";
      }
      return;
    }

    document.getElementById(
      "calcAwayHeader"
    ).textContent = awayName;

    document.getElementById(
      "calcHomeHeader"
    ).textContent = homeName;

    const a = calculate(away, home);
    const h = calculate(home, away);

    body.replaceChildren();

    const rows = [
      [
        "Offensive EPA / Play",
        a.offensiveEPA,
        h.offensiveEPA
      ],
      [
        "Opponent Defensive EPA Allowed",
        a.opponentDefense,
        h.opponentDefense
      ],
      [
        "Estimated Matchup EPA / Play",
        a.matchupEPA,
        h.matchupEPA
      ],
      [
        "Projected First-Half Plays",
        a.halfPlays,
        h.halfPlays
      ],
      [
        "Estimated First-Half Total EPA",
        a.halfEPA,
        h.halfEPA
      ],
      [
        "Projected Full-Game Plays",
        a.fullPlays,
        h.fullPlays
      ],
      [
        "Estimated Full-Game Total EPA",
        a.fullEPA,
        h.fullEPA
      ]
    ];

    rows.forEach(([label, awayValue, homeValue]) => {
      const row = document.createElement("tr");

      [label, format(awayValue), format(homeValue)]
        .forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });

      body.appendChild(row);
    });

    if (status) {
      status.textContent =
        "Illustrative EPA estimates only. " +
        "EPA is not predicted points. " +
        "Matchup EPA is a simple average of " +
        "offensive EPA and opposing defensive " +
        "EPA allowed. First-half calculations " +
        "use full-game EPA rates, not " +
        "first-half-specific efficiency.";
    }
  }

  const previousAnalyze = window.analyze;

  window.analyze = function () {
    if (typeof previousAnalyze === "function") {
      previousAnalyze();
    }

    render();
  };

  Promise.all([
    fetch("data/epa-2026.json", {
      cache: "no-store"
    }).then(response => {
      if (!response.ok) {
        throw new Error("EPA data unavailable");
      }
      return response.json();
    }),

    fetch("data/plays-2026.json", {
      cache: "no-store"
    }).then(response => {
      if (!response.ok) {
        throw new Error("Play data unavailable");
      }
      return response.json();
    })
  ])
    .then(([epa, plays]) => {
      epaData = epa;
      playsData = plays;
      render();
    })
    .catch(error => {
      console.error(error);

      const status =
        document.getElementById("epaCalcStatus");

      if (status) {
        status.textContent =
          "Unable to load calculator data.";
      }
    });
})();
