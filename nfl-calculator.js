
 // DOC'S NFL WAR ROOM
 // EPA PROJECTION CALCULATOR
 // + DOC'S EPA ADVANTAGE EXPERIMENT
 // Works automatically for every NFL matchup.

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

  const number = value =>
    typeof value === "number" &&
    Number.isFinite(value);

  const format = value =>
    number(value) ? value.toFixed(2) : "N/A";

  const signed = (value, digits = 2) => {
    if (!number(value)) return "N/A";
    return (value > 0 ? "+" : "") +
      value.toFixed(digits);
  };

  const average = (a, b) =>
    number(a) && number(b)
      ? (a + b) / 2
      : null;

  const shortName = name =>
    teamCodes[name] || name || "Unknown";

  // ORIGINAL EPA CALCULATOR
  function calculate(team, opponent) {
    if (!team || !opponent) return null;

    const matchupEPA = average(
      team.epa.offensiveEPA,
      opponent.epa.defensiveEPAAllowed
    );

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
      fullEPA:
        number(matchupEPA) && number(fullPlays)
          ? matchupEPA * fullPlays
          : null,
      halfEPA:
        number(matchupEPA) && number(halfPlays)
          ? matchupEPA * halfPlays
          : null
    };
  }

  // CREATE EXPERIMENT PANEL AUTOMATICALLY
  function getExperimentPanel() {
    let panel = document.getElementById(
      "docsEPAExperiment"
    );

    if (panel) return panel;

    const anchor = document.getElementById(
      "epaCalcStatus"
    );

    if (!anchor || !anchor.parentNode) {
      return null;
    }

    panel = document.createElement("section");
    panel.id = "docsEPAExperiment";

    Object.assign(panel.style, {
      marginTop: "22px",
      padding: "18px",
      border: "1px solid #36516b",
      borderRadius: "12px",
      background: "#14283c",
      color: "#f1f5f9",
      lineHeight: "1.65"
    });

    anchor.insertAdjacentElement(
      "afterend",
      panel
    );

    return panel;
  }

  function addText(parent, tag, content, options = {}) {
    const element = document.createElement(tag);
    element.textContent = content;

    if (options.color) {
      element.style.color = options.color;
    }

    if (options.margin) {
      element.style.margin = options.margin;
    }

    if (options.weight) {
      element.style.fontWeight = options.weight;
    }

    parent.appendChild(element);
    return element;
  }

  function addCalculation(
    panel,
    heading,
    equation,
    result,
    description = ""
  ) {
    const block = document.createElement("div");

    Object.assign(block.style, {
      background: "#20374c",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "12px",
      overflowWrap: "anywhere"
    });

    addText(block, "div", heading, {
      weight: "bold",
      color: "#e2e8f0"
    });

    const math = addText(
      block,
      "div",
      equation,
      { color: "#cbd5e1" }
    );

    math.style.fontFamily = "monospace";
    math.style.marginTop = "5px";

    const answer = addText(
      block,
      "div",
      result,
      {
        weight: "bold",
        color: "#ffffff"
      }
    );

    answer.style.fontSize = "19px";
    answer.style.marginTop = "5px";

    if (description) {
      addText(block, "div", description, {
        color: "#b7c7d7"
      });
    }

    panel.appendChild(block);
  }

  function addHeading(panel, text) {
    const heading = addText(
      panel,
      "h4",
      text,
      { color: "#f8fafc" }
    );

    heading.style.margin = "20px 0 10px";
  }

  function advantageDescription(
    value,
    awayName,
    homeName
  ) {
    if (!number(value)) {
      return "Insufficient data";
    }

    if (Math.abs(value) < 0.000001) {
      return "Neither team has an advantage";
    }

    return value > 0
      ? awayName + " advantage"
      : homeName + " advantage";
  }

  function renderExperiment(
    awayName,
    homeName,
    away,
    home,
    a,
    h
  ) {
    const panel = getExperimentPanel();
    if (!panel) return;

    panel.replaceChildren();

    addText(
      panel,
      "h3",
      "DOC'S EPA ADVANTAGE EXPERIMENT",
      { color: "#ffffff" }
    );

    addText(
      panel,
      "p",
      shortName(awayName) +
      " vs " +
      shortName(homeName) +
      " | Full-game calculations",
      { color: "#cbd5e1" }
    );

    const required = [
      a.offensiveEPA,
      h.offensiveEPA,
      a.fullPlays,
      h.fullPlays,
      away.epa.defensiveEPAAllowed,
      home.epa.defensiveEPAAllowed
    ];

    if (!required.every(number)) {
      addText(
        panel,
        "p",
        "DATA UNAVAILABLE: This matchup is " +
        "missing one or more required EPA " +
        "or projected-play statistics."
      );
      return;
    }

    const awayCode = shortName(awayName);
    const homeCode = shortName(homeName);

    // RAW OFFENSIVE EPA
    const awayOffensiveTotal =
      a.offensiveEPA * a.fullPlays;

    const homeOffensiveTotal =
      h.offensiveEPA * h.fullPlays;

    // Positive means away offense advantage.
    const offensiveDifference =
      awayOffensiveTotal - homeOffensiveTotal;

    // DEFENSIVE EPA ALLOWED
    // Each defense faces the OTHER team's plays.
    const awayDefensiveTotal =
      away.epa.defensiveEPAAllowed * h.fullPlays;

    const homeDefensiveTotal =
      home.epa.defensiveEPAAllowed * a.fullPlays;

    // Positive means away defense advantage:
    // home allowed EPA minus away allowed EPA.
    const defensiveAdvantage =
      homeDefensiveTotal - awayDefensiveTotal;

    // EXPERIMENTAL FORMULA
    // Keep both values signed from the AWAY
    // team's perspective.
    const experimentalDifference =
      offensiveDifference - defensiveAdvantage;

    addHeading(
      panel,
      "STEP 1 — OFFENSIVE EPA"
    );

    addCalculation(
      panel,
      awayCode + " Offensive EPA",
      signed(a.offensiveEPA, 3) +
      " × " + format(a.fullPlays) +
      " projected plays",
      signed(awayOffensiveTotal) + " EPA",
      "Raw offensive EPA across projected plays"
    );

    addCalculation(
      panel,
      homeCode + " Offensive EPA",
      signed(h.offensiveEPA, 3) +
      " × " + format(h.fullPlays) +
      " projected plays",
      signed(homeOffensiveTotal) + " EPA",
      "Raw offensive EPA across projected plays"
    );

    addCalculation(
      panel,
      "Offensive Advantage",
      "(" + signed(awayOffensiveTotal) + ")" +
      " − (" + signed(homeOffensiveTotal) + ")",
      signed(offensiveDifference) + " EPA",
      advantageDescription(
        offensiveDifference,
        awayName,
        homeName
      )
    );

    addHeading(
      panel,
      "STEP 2 — DEFENSIVE EPA"
    );

    addCalculation(
      panel,
      awayCode + " Defensive EPA Allowed",
      signed(
        away.epa.defensiveEPAAllowed,
        3
      ) +
      " × " + format(h.fullPlays) +
      " opponent plays",
      signed(awayDefensiveTotal) + " EPA",
      "Negative allowed EPA indicates " +
      "stronger defensive efficiency"
    );

    addCalculation(
      panel,
      homeCode + " Defensive EPA Allowed",
      signed(
        home.epa.defensiveEPAAllowed,
        3
      ) +
      " × " + format(a.fullPlays) +
      " opponent plays",
      signed(homeDefensiveTotal) + " EPA",
      "Uses the opposing offense's " +
      "projected play count"
    );

    addCalculation(
      panel,
      "Defensive Advantage",
      "(" + signed(homeDefensiveTotal) + ")" +
      " − (" + signed(awayDefensiveTotal) + ")",
      signed(defensiveAdvantage) + " EPA",
      advantageDescription(
        defensiveAdvantage,
        awayName,
        homeName
      )
    );

    addHeading(
      panel,
      "STEP 3 — EXPERIMENTAL SUBTRACTION"
    );

    addCalculation(
      panel,
      "Offensive Advantage − Defensive Advantage",
      "(" + signed(offensiveDifference) + ")" +
      " − (" + signed(defensiveAdvantage) + ")",
      signed(experimentalDifference) + " EPA",
      advantageDescription(
        experimentalDifference,
        awayName,
        homeName
      )
    );

    // Also show the opponent-adjusted
    // calculation already used by the
    // existing EPA Projection Calculator.
    addHeading(
      panel,
      "STEP 4 — OPPONENT-ADJUSTED EPA"
    );

    addCalculation(
      panel,
      awayCode + " Matchup EPA",
      "((" + signed(a.offensiveEPA, 3) +
      ") + (" + signed(a.opponentDefense, 3) +
      ")) ÷ 2 × " + format(a.fullPlays),
      signed(a.fullEPA) + " EPA",
      "Existing matchup EPA calculation"
    );

    addCalculation(
      panel,
      homeCode + " Matchup EPA",
      "((" + signed(h.offensiveEPA, 3) +
      ") + (" + signed(h.opponentDefense, 3) +
      ")) ÷ 2 × " + format(h.fullPlays),
      signed(h.fullEPA) + " EPA",
      "Existing matchup EPA calculation"
    );

    if (number(a.fullEPA) && number(h.fullEPA)) {
      const adjustedDifference =
        a.fullEPA - h.fullEPA;

      addCalculation(
        panel,
        "Opponent-Adjusted EPA Difference",
        "(" + signed(a.fullEPA) + ")" +
        " − (" + signed(h.fullEPA) + ")",
        signed(adjustedDifference) + " EPA",
        advantageDescription(
          adjustedDifference,
          awayName,
          homeName
        )
      );
    }

    
    // STEP 5 — NUMERICAL INTERPRETATION
    addHeading(
      panel,
      "STEP 5 — WHAT THE NUMBERS MEAN"
    );

    const awayOffense = awayOffensiveTotal;
    const homeOffense = homeOffensiveTotal;
    const awayDefense = awayDefensiveTotal;
    const homeDefense = homeDefensiveTotal;

    addCalculation(
      panel,
      "1. OFFENSIVE EPA ADVANTAGE",
      awayCode + " " + signed(awayOffense) +
      " − " + homeCode + " (" +
      signed(homeOffense) + ")",
      signed(offensiveDifference) + " EPA",
      advantageDescription(
        offensiveDifference,
        awayName,
        homeName
      )
    );

    addCalculation(
      panel,
      "2. DEFENSIVE EPA ADVANTAGE",
      homeCode + " allowed " +
      signed(homeDefense) +
      " − " + awayCode + " allowed (" +
      signed(awayDefense) + ")",
      signed(defensiveAdvantage) + " EPA",
      advantageDescription(
        defensiveAdvantage,
        awayName,
        homeName
      )
    );

    addCalculation(
      panel,
      "3. DOC'S EXPERIMENTAL SUBTRACTION",
      "(" + signed(offensiveDifference) +
      ") − (" +
      signed(defensiveAdvantage) + ")",
      signed(experimentalDifference) + " EPA",
      advantageDescription(
        experimentalDifference,
        awayName,
        homeName
      )
    );

    if (
      number(a.fullEPA) &&
      number(h.fullEPA)
    ) {
      const adjustedDifference =
        a.fullEPA - h.fullEPA;

      addCalculation(
        panel,
        "4. OPPONENT-ADJUSTED EPA DIFFERENCE",
        "(" + signed(a.fullEPA) +
        ") − (" + signed(h.fullEPA) + ")",
        signed(adjustedDifference) + " EPA",
        advantageDescription(
          adjustedDifference,
          awayName,
          homeName
        )
      );
    }

    const interpretation = document.createElement("div");

    interpretation.style.padding = "14px";
    interpretation.style.marginTop = "12px";
    interpretation.style.border =
      "1px solid #36516b";
    interpretation.style.borderRadius = "8px";
    interpretation.style.background = "#20374c";

    const line = (label, value) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label + ": ";
      p.appendChild(strong);
      p.appendChild(document.createTextNode(value));
      interpretation.appendChild(p);
    };

    line(
      "Offensive EPA difference",
      signed(offensiveDifference) +
      " — " +
      advantageDescription(
        offensiveDifference,
        awayName,
        homeName
      )
    );

    line(
      "Defensive EPA difference",
      signed(defensiveAdvantage) +
      " — " +
      advantageDescription(
        defensiveAdvantage,
        awayName,
        homeName
      )
    );

    line(
      "Experimental subtraction",
      signed(offensiveDifference) +
      " − (" +
      signed(defensiveAdvantage) +
      ") = " +
      signed(experimentalDifference)
    );

    line(
      "Experimental direction",
      advantageDescription(
        experimentalDifference,
        awayName,
        homeName
      )
    );

    panel.appendChild(interpretation);


    const note = addText(
      panel,
      "p",
      "RESEARCH NOTE: These values are " +
      "expected-points-added comparisons, " +
      "not scoreboard points. The subtraction " +
      "is an unvalidated experimental formula. " +
      "Offensive and defensive EPA describe " +
      "overlapping aspects of the matchup, " +
      "so the result must not automatically " +
      "be treated as a predicted point spread. " +
      "Compare it with the independent scoring " +
      "engine and actual game results."
    );

    note.style.fontSize = "13px";
    note.style.color = "#cbd5e1";
    note.style.borderTop =
      "1px solid #36516b";
    note.style.paddingTop = "12px";

    const precision = addText(
      panel,
      "p",
      "Calculations use unrounded source " +
      "values. Displayed equations are rounded, " +
      "so recomputing from displayed values " +
      "may differ slightly."
    );

    precision.style.fontSize = "12px";
    precision.style.color = "#aebfd0";
  }

  function render() {
    const body = document.getElementById(
      "epaCalcBody"
    );

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

    if (
      !awayCode ||
      !homeCode ||
      awayCode === homeCode
    ) {
      body.replaceChildren();
      getExperimentPanel()?.replaceChildren();

      if (status) {
        status.textContent =
          "Select two different NFL teams.";
      }
      return;
    }

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
      body.replaceChildren();
      getExperimentPanel()?.replaceChildren();

      if (status) {
        status.textContent =
          "Statistics unavailable for this matchup.";
      }
      return;
    }

    const awayHeader = document.getElementById(
      "calcAwayHeader"
    );

    const homeHeader = document.getElementById(
      "calcHomeHeader"
    );

    if (awayHeader) {
      awayHeader.textContent = awayName;
    }

    if (homeHeader) {
      homeHeader.textContent = homeName;
    }

    const a = calculate(away, home);
    const h = calculate(home, away);

    body.replaceChildren();

    // ORIGINAL SEVEN ROWS PRESERVED
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

    rows.forEach(
      ([label, awayValue, homeValue]) => {
        const row = document.createElement("tr");

        [
          label,
          format(awayValue),
          format(homeValue)
        ].forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });

        body.appendChild(row);
      }
    );

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

    renderExperiment(
      awayName,
      homeName,
      away,
      home,
      a,
      h
    );
  }

  // PRESERVE EXISTING ANALYZE CHAIN
  const previousAnalyze = window.analyze;

  window.analyze = function (...args) {
    if (typeof previousAnalyze === "function") {
      previousAnalyze.apply(this, args);
    }

    render();
  };

  // ORIGINAL DATA SOURCES PRESERVED
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
