// ============================================================
// DOC'S NFL WAR ROOM
// PLAYER PROPS RECEIPT — KAMBI CONNECTED
// ============================================================

(() => {
  "use strict";

  const RECORDS_URL =
    "https://script.google.com/macros/s/AKfycbxovg8I9EhY3QNZ5Bl81jJDJiQ_Ddr4NwNIyO3lXiNmr0qq5w06hj7dA1DBjuuDUfHI/exec";

  const KAMBI_URL =
    "data/kambi-player-props-2026.json";


  // ============================================================
  // TEAM DATA
  // ============================================================

  const TEAM_NAMES = {
    ARI: "Arizona Cardinals",
    ATL: "Atlanta Falcons",
    BAL: "Baltimore Ravens",
    BUF: "Buffalo Bills",
    CAR: "Carolina Panthers",
    CHI: "Chicago Bears",
    CIN: "Cincinnati Bengals",
    CLE: "Cleveland Browns",
    DAL: "Dallas Cowboys",
    DEN: "Denver Broncos",
    DET: "Detroit Lions",
    GB: "Green Bay Packers",
    HOU: "Houston Texans",
    IND: "Indianapolis Colts",
    JAX: "Jacksonville Jaguars",
    KC: "Kansas City Chiefs",
    LV: "Las Vegas Raiders",
    LAC: "Los Angeles Chargers",
    LAR: "Los Angeles Rams",
    MIA: "Miami Dolphins",
    MIN: "Minnesota Vikings",
    NE: "New England Patriots",
    NO: "New Orleans Saints",
    NYG: "New York Giants",
    NYJ: "New York Jets",
    PHI: "Philadelphia Eagles",
    PIT: "Pittsburgh Steelers",
    SEA: "Seattle Seahawks",
    SF: "San Francisco 49ers",
    TB: "Tampa Bay Buccaneers",
    TEN: "Tennessee Titans",
    WAS: "Washington Commanders"
  };


  const KAMBI_NAMES = {
    ARI: ["ARI Cardinals", "Arizona Cardinals"],
    ATL: ["ATL Falcons", "Atlanta Falcons"],
    BAL: ["BAL Ravens", "Baltimore Ravens"],
    BUF: ["BUF Bills", "Buffalo Bills"],
    CAR: ["CAR Panthers", "Carolina Panthers"],
    CHI: ["CHI Bears", "Chicago Bears"],
    CIN: ["CIN Bengals", "Cincinnati Bengals"],
    CLE: ["CLE Browns", "Cleveland Browns"],
    DAL: ["DAL Cowboys", "Dallas Cowboys"],
    DEN: ["DEN Broncos", "Denver Broncos"],
    DET: ["DET Lions", "Detroit Lions"],
    GB: ["GB Packers", "Green Bay Packers"],
    HOU: ["HOU Texans", "Houston Texans"],
    IND: ["IND Colts", "Indianapolis Colts"],
    JAX: ["JAX Jaguars", "Jacksonville Jaguars"],
    KC: ["KC Chiefs", "Kansas City Chiefs"],
    LV: ["LV Raiders", "Las Vegas Raiders"],
    LAC: ["LA Chargers", "Los Angeles Chargers"],
    LAR: ["LA Rams", "Los Angeles Rams"],
    MIA: ["MIA Dolphins", "Miami Dolphins"],
    MIN: ["MIN Vikings", "Minnesota Vikings"],
    NE: ["NE Patriots", "New England Patriots"],
    NO: ["NO Saints", "New Orleans Saints"],
    NYG: ["NY Giants", "New York Giants"],
    NYJ: ["NY Jets", "New York Jets"],
    PHI: ["PHI Eagles", "Philadelphia Eagles"],
    PIT: ["PIT Steelers", "Pittsburgh Steelers"],
    SEA: ["SEA Seahawks", "Seattle Seahawks"],
    SF: ["SF 49ers", "San Francisco 49ers"],
    TB: ["TB Buccaneers", "Tampa Bay Buccaneers"],
    TEN: ["TEN Titans", "Tennessee Titans"],
    WAS: ["WAS Commanders", "Washington Commanders"]
  };


  // ============================================================
  // STATE
  // ============================================================

  let kambiData = null;
  let kambiLoadError = "";
  let kambiLoading = null;


  // ============================================================
  // BASIC HELPERS
  // ============================================================

  function clean(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function numberFrom(value) {
    const match =
      clean(value)
        .replace(/,/g, "")
        .match(/-?\d+(?:\.\d+)?/);

    return match
      ? Number(match[0])
      : 0;
  }


  function escapeHtml(value) {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function normalize(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }


  function getRows(bodyId) {
    const body =
      document.getElementById(bodyId);

    if (!body) {
      return [];
    }

    return Array.from(
      body.querySelectorAll("tr")
    ).map(row =>
      Array.from(
        row.querySelectorAll("td")
      ).map(cell =>
        clean(cell.textContent)
      )
    );
  }


  function fullTeamName(code) {
    return (
      TEAM_NAMES[
        clean(code).toUpperCase()
      ] || clean(code)
    );
  }


  function displayTeam(code) {
    const team =
      clean(code).toUpperCase();

    if (!team) {
      return "";
    }

    const name =
      fullTeamName(team);

    return name === team
      ? team
      : `${team} — ${name}`;
  }


  // ============================================================
  // TEAM NORMALIZATION
  // ============================================================

  function teamCodeFromValue(value) {

    const raw =
      clean(value);

    if (!raw) {
      return "";
    }

    const upper =
      raw.toUpperCase();


    // Already a team code.
    if (TEAM_NAMES[upper]) {
      return upper;
    }


    // Exact full-name match.
    for (
      const [code, fullName]
      of Object.entries(TEAM_NAMES)
    ) {

      if (
        normalize(raw) ===
        normalize(fullName)
      ) {
        return code;
      }
    }


    // Kambi-style team-name match.
    for (
      const [code, aliases]
      of Object.entries(KAMBI_NAMES)
    ) {

      if (
        aliases.some(alias =>
          normalize(alias) ===
          normalize(raw)
        )
      ) {
        return code;
      }
    }


    return "";
  }


  function getSelectedTeam(id) {

    const select =
      document.getElementById(id);

    if (!select) {
      return "";
    }


    /*
      First try the actual select value.
    */

    let code =
      teamCodeFromValue(
        select.value
      );

    if (code) {
      return code;
    }


    /*
      If the HTML option value and visible
      text differ, try the visible text too.
    */

    const selectedOption =
      select.options &&
      select.selectedIndex >= 0
        ? select.options[
            select.selectedIndex
          ]
        : null;


    if (selectedOption) {

      code =
        teamCodeFromValue(
          selectedOption.textContent
        );

      if (code) {
        return code;
      }
    }


    console.warn(
      "Could not identify selected NFL team:",
      select.value,
      selectedOption
        ? selectedOption.textContent
        : ""
    );


    return "";
  }


  function getMatchup() {

    const away =
      getSelectedTeam("away");

    const home =
      getSelectedTeam("home");

    if (
      !away ||
      !home ||
      away === home
    ) {
      return "";
    }

    return (
      `${displayTeam(away)} @ ` +
      `${displayTeam(home)}`
    );
  }


  function opponentFor(team) {

    const away =
      getSelectedTeam("away");

    const home =
      getSelectedTeam("home");

    const code =
      teamCodeFromValue(team) ||
      clean(team).toUpperCase();


    if (code === away) {
      return home;
    }

    if (code === home) {
      return away;
    }

    return "";
  }


  // ============================================================
  // KAMBI LOADER
  // ============================================================

  async function loadKambiData() {

    if (kambiData) {
      return kambiData;
    }

    if (kambiLoading) {
      return kambiLoading;
    }


    kambiLoading =
      fetch(
        KAMBI_URL,
        {
          cache: "no-store"
        }
      )
        .then(response => {

          if (!response.ok) {
            throw new Error(
              `Kambi file returned ${response.status}`
            );
          }

          return response.json();
        })
        .then(data => {

          if (!data) {
            throw new Error(
              "Kambi file was empty."
            );
          }


          if (
            !Array.isArray(data.events)
          ) {
            throw new Error(
              "Kambi events list is missing."
            );
          }


          if (
            !Array.isArray(data.props)
          ) {
            throw new Error(
              "Kambi props list is missing."
            );
          }


          kambiData = data;
          kambiLoadError = "";


          console.log(
            "PLAYER RECEIPT KAMBI LOADED",
            data.counts
          );


          return data;
        })
        .catch(error => {

          console.error(
            "PLAYER RECEIPT KAMBI ERROR",
            error
          );

          kambiLoadError =
            error.message;

          kambiData = null;

          return null;
        });


    return kambiLoading;
  }


  // ============================================================
  // KAMBI EVENT MATCHING
  // ============================================================

  function eventHasTeam(
    eventName,
    teamCode
  ) {

    const aliases =
      KAMBI_NAMES[teamCode] || [];

    const eventNormalized =
      normalize(eventName);


    return aliases.some(alias =>
      eventNormalized.includes(
        normalize(alias)
      )
    );
  }


  function findSelectedKambiEvent() {

    if (
      !kambiData ||
      !Array.isArray(kambiData.events)
    ) {
      return null;
    }


    const away =
      getSelectedTeam("away");

    const home =
      getSelectedTeam("home");


    if (!away || !home) {
      return null;
    }


    const matches =
      kambiData.events.filter(event => {

        const name =
          clean(event.name);

        return (
          eventHasTeam(
            name,
            away
          ) &&
          eventHasTeam(
            name,
            home
          )
        );
      });


    if (matches.length === 1) {

      console.log(
        "KAMBI EVENT MATCH:",
        matches[0]
      );

      return matches[0];
    }


    console.warn(
      "KAMBI EVENT MATCH COUNT:",
      matches.length,
      {
        away,
        home,
        matches
      }
    );


    return null;
  }


  function propsForEvent(event) {

    if (
      !event ||
      !kambiData
    ) {
      return [];
    }


    return kambiData.props.filter(prop => {

      const propEventId =
        prop.eventId ??
        prop.event_id ??
        prop.eventID;

      return (
        String(propEventId) ===
        String(event.id)
      );
    });
  }


  // ============================================================
  // DEFENSIVE DATA
  // ============================================================

  function getDefense(team) {

    const code =
      clean(team).toUpperCase();

    const rows =
      getRows("defenseBody");


    const row =
      rows.find(r =>
        clean(r[0]).toUpperCase() ===
        code
      );


    if (!row) {
      return null;
    }


    return {
      team: code,

      games:
        numberFrom(row[1]),

      explosiveAllowed:
        numberFrom(row[2]),

      explosiveAllowedPerGame:
        numberFrom(row[3]),

      yacAllowed:
        numberFrom(row[4]),

      yacAllowedPerGame:
        numberFrom(row[5])
    };
  }


  // ============================================================
  // QUARTERBACK DATA
  // ============================================================

  function collectQuarterbacks() {

    const rows =
      getRows("qbPassingBody");


    return rows
      .map(row => {

        const team =
          clean(row[0]).toUpperCase();

        const attempts =
          numberFrom(row[2]);

        const attemptsPerGame =
          numberFrom(row[5]);

        const passingYards =
          numberFrom(row[6]);

        const yardsPerAttempt =
          numberFrom(row[7]);

        const passingTDs =
          numberFrom(row[8]);

        const interceptions =
          numberFrom(row[9]);


        let estimatedGames = 0;


        if (
          attempts > 0 &&
          attemptsPerGame > 0
        ) {

          estimatedGames =
            attempts /
            attemptsPerGame;
        }


        const yardsPerGame =
          estimatedGames > 0
            ? passingYards /
              estimatedGames
            : 0;


        return {
          category: "QB",

          team,

          opponent:
            opponentFor(team),

          player:
            clean(row[1]),

          attempts,

          completions:
            numberFrom(row[3]),

          completionPct:
            numberFrom(row[4]),

          attemptsPerGame,

          passingYards,

          yardsPerGame,

          yardsPerAttempt,

          passingTDs,

          interceptions
        };
      })
      .filter(player =>
        player.team &&
        player.player &&
        (
          player.attempts >= 20 ||
          player.attemptsPerGame >= 10
        )
      );
  }


  // ============================================================
  // RECEIVER DATA
  // ============================================================

  function collectReceivers() {

    const rows =
      getRows("targetBody");


    return rows
      .map(row => {

        const team =
          clean(row[0]).toUpperCase();

        const opponent =
          opponentFor(team);

        const defense =
          getDefense(opponent);


        return {
          category:
            "RECEIVING",

          team,

          opponent,

          player:
            clean(row[1]),

          targets:
            numberFrom(row[2]),

          targetsPerGame:
            numberFrom(row[3]),

          receptions:
            numberFrom(row[4]),

          yards:
            numberFrom(row[5]),

          yardsPerGame:
            numberFrom(row[6]),

          yac:
            numberFrom(row[7]),

          yacPerReception:
            numberFrom(row[8]),

          explosiveCatches:
            numberFrom(row[9]),

          explosiveRate:
            numberFrom(row[10]),

          catchPct:
            numberFrom(row[11]),

          redZoneTargets:
            numberFrom(row[12]),

          inside10Targets:
            numberFrom(row[13]),

          touchdowns:
            numberFrom(row[14]),

          opponentExplosiveAllowedPerGame:
            defense
              ? defense
                  .explosiveAllowedPerGame
              : 0,

          opponentYacAllowedPerGame:
            defense
              ? defense
                  .yacAllowedPerGame
              : 0
        };
      })
      .filter(player =>
        player.team &&
        player.player &&
        player.targets >= 4
      );
  }


  // ============================================================
  // RUSHING DATA
  // ============================================================

  function collectRushers() {

    const rows =
      getRows("rushingBody");


    return rows
      .map(row => {

        const team =
          clean(row[0]).toUpperCase();


        return {
          category:
            "RUSHING",

          team,

          opponent:
            opponentFor(team),

          player:
            clean(row[1]),

          games:
            numberFrom(row[2]),

          carries:
            numberFrom(row[3]),

          carriesPerGame:
            numberFrom(row[4]),

          rushingYards:
            numberFrom(row[5]),

          yardsPerGame:
            numberFrom(row[6]),

          yardsPerCarry:
            numberFrom(row[7]),

          rushingTDs:
            numberFrom(row[8]),

          redZoneCarries:
            numberFrom(row[9]),

          inside10Carries:
            numberFrom(row[10])
        };
      })
      .filter(player =>
        player.team &&
        player.player &&
        player.carries >= 5
      );
  }


  // ============================================================
  // WAR ROOM TARGET SELECTION
  // ============================================================

  function bestQBVolumeTarget(qbs) {

    if (!qbs.length) {
      return null;
    }


    const player =
      [...qbs]
        .sort((a, b) => {

          if (
            b.attemptsPerGame !==
            a.attemptsPerGame
          ) {

            return (
              b.attemptsPerGame -
              a.attemptsPerGame
            );
          }


          if (
            b.yardsPerGame !==
            a.yardsPerGame
          ) {

            return (
              b.yardsPerGame -
              a.yardsPerGame
            );
          }


          return (
            b.yardsPerAttempt -
            a.yardsPerAttempt
          );
        })[0];


    return {
      type:
        "PASSING_YARDS",

      label:
        "TOP QB VOLUME TARGET",

      originalMarket:
        "QB Passing Target",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      average:
        player.yardsPerGame,

      averageLabel:
        "Passing yards/game",

      evidence:
        `${player.attemptsPerGame.toFixed(2)} attempts/game, ` +
        `${player.yardsPerGame.toFixed(1)} passing yards/game, ` +
        `${player.yardsPerAttempt.toFixed(2)} yards/attempt, ` +
        `${player.passingTDs} passing TD, ` +
        `${player.interceptions} INT.`,

      reason:
        "Highest qualifying passing-volume profile in the current War Room matchup."
    };
  }


  function bestReceiverVolumeTarget(
    receivers
  ) {

    if (!receivers.length) {
      return null;
    }


    const player =
      [...receivers]
        .sort((a, b) => {

          if (
            b.targetsPerGame !==
            a.targetsPerGame
          ) {

            return (
              b.targetsPerGame -
              a.targetsPerGame
            );
          }


          if (
            b.yardsPerGame !==
            a.yardsPerGame
          ) {

            return (
              b.yardsPerGame -
              a.yardsPerGame
            );
          }


          return (
            b.receptions -
            a.receptions
          );
        })[0];


    return {
      type:
        "RECEIVING_YARDS",

      label:
        "TOP RECEIVING VOLUME TARGET",

      originalMarket:
        "Receiving Volume Target",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      average:
        player.yardsPerGame,

      averageLabel:
        "Receiving yards/game",

      evidence:
        `${player.targetsPerGame.toFixed(2)} targets/game, ` +
        `${player.yardsPerGame.toFixed(2)} receiving yards/game, ` +
        `${player.catchPct.toFixed(1)}% catch rate.`,

      reason:
        "Highest qualifying target-volume profile in the current War Room matchup."
    };
  }


  function bestReceiverScoringTarget(
    receivers
  ) {

    if (!receivers.length) {
      return null;
    }


    const player =
      [...receivers]
        .sort((a, b) => {

          if (
            b.inside10Targets !==
            a.inside10Targets
          ) {

            return (
              b.inside10Targets -
              a.inside10Targets
            );
          }


          if (
            b.redZoneTargets !==
            a.redZoneTargets
          ) {

            return (
              b.redZoneTargets -
              a.redZoneTargets
            );
          }


          if (
            b.touchdowns !==
            a.touchdowns
          ) {

            return (
              b.touchdowns -
              a.touchdowns
            );
          }


          return (
            b.targetsPerGame -
            a.targetsPerGame
          );
        })[0];


    return {
      type:
        "TOUCHDOWN",

      label:
        "TOP RECEIVING SCORING TARGET",

      originalMarket:
        "Receiving TD / Red Zone Target",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      average: null,

      averageLabel: "",

      evidence:
        `${player.redZoneTargets} red-zone targets, ` +
        `${player.inside10Targets} inside-10 targets, ` +
        `${player.touchdowns} TD, ` +
        `${player.targetsPerGame.toFixed(2)} targets/game.`,

      reason:
        "Strongest receiving scoring-opportunity profile based on current red-zone and inside-10 usage."
    };
  }


  function bestExplosiveReceiverTarget(
    receivers
  ) {

    const eligible =
      receivers.filter(player =>
        player.explosiveCatches > 0
      );


    if (!eligible.length) {
      return null;
    }


    const player =
      [...eligible]
        .sort((a, b) => {

          if (
            b.explosiveRate !==
            a.explosiveRate
          ) {

            return (
              b.explosiveRate -
              a.explosiveRate
            );
          }


          if (
            b.explosiveCatches !==
            a.explosiveCatches
          ) {

            return (
              b.explosiveCatches -
              a.explosiveCatches
            );
          }


          return (
            b.yardsPerGame -
            a.yardsPerGame
          );
        })[0];


    return {
      type:
        "RECEIVING_YARDS",

      label:
        "TOP EXPLOSIVE RECEIVING TARGET",

      originalMarket:
        "Explosive Receiving Target",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      average:
        player.yardsPerGame,

      averageLabel:
        "Receiving yards/game",

      evidence:
        `${player.explosiveCatches} catches of 20+ yards, ` +
        `${player.explosiveRate.toFixed(1)}% explosive rate, ` +
        `${player.yardsPerGame.toFixed(2)} receiving yards/game. ` +
        `${displayTeam(player.opponent)} defense allows ` +
        `${player.opponentExplosiveAllowedPerGame.toFixed(2)} 20+ catches/game.`,

      reason:
        "Strongest explosive receiving profile among qualifying players in the matchup."
    };
  }


  function bestRushingVolumeTarget(
    rushers
  ) {

    if (!rushers.length) {
      return null;
    }


    const player =
      [...rushers]
        .sort((a, b) => {

          if (
            b.carriesPerGame !==
            a.carriesPerGame
          ) {

            return (
              b.carriesPerGame -
              a.carriesPerGame
            );
          }


          if (
            b.yardsPerGame !==
            a.yardsPerGame
          ) {

            return (
              b.yardsPerGame -
              a.yardsPerGame
            );
          }


          return (
            b.yardsPerCarry -
            a.yardsPerCarry
          );
        })[0];


    return {
      type:
        "RUSHING_YARDS",

      label:
        "TOP RUSHING WORKLOAD TARGET",

      originalMarket:
        "Rushing Volume Target",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      average:
        player.yardsPerGame,

      averageLabel:
        "Rushing yards/game",

      evidence:
        `${player.carriesPerGame.toFixed(2)} carries/game, ` +
        `${player.yardsPerGame.toFixed(2)} rushing yards/game, ` +
        `${player.yardsPerCarry.toFixed(2)} yards/carry.`,

      reason:
        "Highest qualifying rushing-workload profile in the current War Room matchup."
    };
  }


  function bestRushingScoringTarget(
    rushers
  ) {

    if (!rushers.length) {
      return null;
    }


    const player =
      [...rushers]
        .sort((a, b) => {

          if (
            b.inside10Carries !==
            a.inside10Carries
          ) {

            return (
              b.inside10Carries -
              a.inside10Carries
            );
          }


          if (
            b.redZoneCarries !==
            a.redZoneCarries
          ) {

            return (
              b.redZoneCarries -
              a.redZoneCarries
            );
          }


          if (
            b.rushingTDs !==
            a.rushingTDs
          ) {

            return (
              b.rushingTDs -
              a.rushingTDs
            );
          }


          return (
            b.carriesPerGame -
            a.carriesPerGame
          );
        })[0];


    return {
      type:
        "TOUCHDOWN",

      label:
        "TOP RUSHING SCORING TARGET",

      originalMarket:
        "Rushing TD / Red Zone Target",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      average: null,

      averageLabel: "",

      evidence:
        `${player.redZoneCarries} red-zone carries, ` +
        `${player.inside10Carries} inside-10 carries, ` +
        `${player.rushingTDs} rushing TD, ` +
        `${player.carriesPerGame.toFixed(2)} carries/game.`,

      reason:
        "Strongest rushing scoring-opportunity profile based on current red-zone and inside-10 workload."
    };
  }


  function buildTargets() {

    const qbs =
      collectQuarterbacks();

    const receivers =
      collectReceivers();

    const rushers =
      collectRushers();


    return [
      bestQBVolumeTarget(qbs),

      bestReceiverVolumeTarget(
        receivers
      ),

      bestReceiverScoringTarget(
        receivers
      ),

      bestExplosiveReceiverTarget(
        receivers
      ),

      bestRushingVolumeTarget(
        rushers
      ),

      bestRushingScoringTarget(
        rushers
      )
    ].filter(Boolean);
  }


  // ============================================================
  // PLAYER NAME MATCHING
  // ============================================================

  function nameParts(value) {

    const text =
      clean(value)
        .toLowerCase()
        .replace(
          /\b(jr|sr|ii|iii|iv)\b\.?/g,
          ""
        )
        .replace(
          /[^a-z0-9 ]/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    const pieces =
      text
        .split(" ")
        .filter(Boolean);


    return {
      full: text,

      first:
        pieces[0] || "",

      last:
        pieces.length
          ? pieces[
              pieces.length - 1
            ]
          : ""
    };
  }


  function samePlayer(
    warRoomPlayer,
    kambiPlayer
  ) {

    const a =
      nameParts(warRoomPlayer);

    const b =
      nameParts(kambiPlayer);


    if (
      !a.full ||
      !b.full
    ) {
      return false;
    }


    if (a.full === b.full) {
      return true;
    }


    if (
      !a.last ||
      a.last !== b.last
    ) {
      return false;
    }


    if (
      a.first &&
      b.first &&
      a.first[0] === b.first[0]
    ) {
      return true;
    }


    return false;
  }


  // ============================================================
  // KAMBI PROP HELPERS
  // ============================================================

  function propPlayer(prop) {

    return clean(
      prop.player ??
      prop.playerName ??
      prop.participant ??
      prop.participantName
    );
  }


  function propStatus(prop) {

    return clean(
      prop.status ??
      prop.outcomeStatus ??
      "OPEN"
    ).toUpperCase();
  }


  function propResolution(prop) {

    return clean(
      prop.resolution ??
      prop.matchType ??
      prop.joinStatus
    ).toUpperCase();
  }


  function propText(prop) {

    return [
      prop.category,
      prop.categoryName,
      prop.market,
      prop.marketName,
      prop.marketLabel,
      prop.displayMarket,
      prop.outcome,
      prop.outcomeLabel,
      prop.label,
      prop.milestone
    ]
      .map(clean)
      .join(" ")
      .toLowerCase();
  }


  function propOdds(prop) {

    const value =
      prop.oddsAmerican ??
      prop.americanOdds ??
      prop.priceAmerican ??
      prop.price ??
      "";


    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }


    const number =
      Number(value);


    if (Number.isFinite(number)) {

      return number > 0
        ? `+${number}`
        : String(number);
    }


    return clean(value);
  }


  function propThreshold(prop) {

    const possibleValues = [
      prop.milestone,
      prop.line,
      prop.threshold,
      prop.outcomeLabel,
      prop.displayMarket,
      prop.marketLabel
    ];


    for (
      const value
      of possibleValues
    ) {

      const text =
        clean(value);


      const plusMatch =
        text.match(
          /(\d+(?:\.\d+)?)\s*\+/
        );


      if (plusMatch) {

        return Number(
          plusMatch[1]
        );
      }
    }


    return null;
  }


  function propMarketDisplay(prop) {

    return (
      clean(prop.displayMarket) ||
      clean(prop.marketLabel) ||
      clean(prop.marketName) ||
      clean(prop.categoryName) ||
      clean(prop.category) ||
      clean(prop.outcomeLabel) ||
      "Kambi Player Prop"
    );
  }


  function isFirstHalf(prop) {

    const text =
      propText(prop);

    return (
      text.includes("first half") ||
      text.includes("1st half")
    );
  }


  function marketMatches(
    prop,
    target
  ) {

    const text =
      propText(prop);


    if (
      target.type ===
      "PASSING_YARDS"
    ) {

      return (
        text.includes(
          "passing yards"
        ) &&
        !isFirstHalf(prop)
      );
    }


    if (
      target.type ===
      "RECEIVING_YARDS"
    ) {

      return (
        text.includes(
          "receiving yards"
        ) &&
        !isFirstHalf(prop)
      );
    }


    if (
      target.type ===
      "RUSHING_YARDS"
    ) {

      return (
        text.includes(
          "rushing yards"
        ) &&
        !isFirstHalf(prop)
      );
    }


    if (
      target.type ===
      "TOUCHDOWN"
    ) {

      return (
        text.includes("touchdown") ||
        text.includes("td scorer") ||
        text.includes("to score")
      );
    }


    return false;
  }


  // ============================================================
  // FIND PLAYER'S VERIFIED KAMBI PROPS
  // ============================================================

  function findPlayerProps(
    target,
    eventProps
  ) {

    const matches =
      eventProps.filter(prop => {

        const player =
          propPlayer(prop);


        if (
          !samePlayer(
            target.player,
            player
          )
        ) {
          return false;
        }


        const status =
          propStatus(prop);


        if (
          status &&
          status !== "OPEN"
        ) {
          return false;
        }


        const resolution =
          propResolution(prop);


        if (
          resolution &&
          resolution !==
            "EXACT_ID_MATCH"
        ) {
          return false;
        }


        return marketMatches(
          prop,
          target
        );
      });


    const playerNames =
      [
        ...new Set(
          matches
            .map(prop =>
              propPlayer(prop)
            )
            .filter(Boolean)
            .map(name =>
              nameParts(name).full
            )
        )
      ];


    if (playerNames.length > 1) {

      return {
        ambiguous: true,
        props: []
      };
    }


    return {
      ambiguous: false,
      props: matches
    };
  }


  // ============================================================
  // SELECT KAMBI MARKET
  // ============================================================

  function chooseVolumeProp(
    target,
    props
  ) {

    const ladder =
      props
        .map(prop => ({
          prop,

          threshold:
            propThreshold(prop)
        }))
        .filter(item =>
          Number.isFinite(
            item.threshold
          )
        );


    if (!ladder.length) {
      return null;
    }


    const average =
      Number(target.average);


    ladder.sort((a, b) => {

      const distanceA =
        Number.isFinite(average)
          ? Math.abs(
              average -
              a.threshold
            )
          : a.threshold;


      const distanceB =
        Number.isFinite(average)
          ? Math.abs(
              average -
              b.threshold
            )
          : b.threshold;


      if (
        distanceA !== distanceB
      ) {

        return (
          distanceA -
          distanceB
        );
      }


      return (
        a.threshold -
        b.threshold
      );
    });


    return ladder[0].prop;
  }


  function chooseTouchdownProp(
    props
  ) {

    if (!props.length) {
      return null;
    }


    const ranked =
      [...props]
        .map(prop => {

          const text =
            propText(prop);

          let score = 0;


          if (
            text.includes("anytime")
          ) {
            score += 20;
          }


          if (
            text.includes(
              "touchdown scorer"
            )
          ) {
            score += 15;
          }


          if (
            text.includes("to score")
          ) {
            score += 10;
          }


          if (
            text.includes(
              "first touchdown"
            )
          ) {
            score -= 30;
          }


          if (
            text.includes(
              "last touchdown"
            )
          ) {
            score -= 30;
          }


          if (
            text.includes("2+") ||
            text.includes("3+")
          ) {
            score -= 20;
          }


          if (isFirstHalf(prop)) {
            score -= 20;
          }


          return {
            prop,
            score
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score
        );


    return ranked[0].prop;
  }


  function connectTargetToKambi(
    target,
    eventProps
  ) {

    const lookup =
      findPlayerProps(
        target,
        eventProps
      );


    if (lookup.ambiguous) {

      return {
        ...target,

        verified: false,

        status:
          "AMBIGUOUS PLAYER MATCH"
      };
    }


    if (!lookup.props.length) {

      return {
        ...target,

        verified: false,

        status:
          "NO VERIFIED KAMBI MARKET"
      };
    }


    const selected =
      target.type === "TOUCHDOWN"
        ? chooseTouchdownProp(
            lookup.props
          )
        : chooseVolumeProp(
            target,
            lookup.props
          );


    if (!selected) {

      return {
        ...target,

        verified: false,

        status:
          "NO COMPARABLE KAMBI LINE"
      };
    }


    const threshold =
      propThreshold(selected);


    const price =
      propOdds(selected);


    const player =
      propPlayer(selected);


    const market =
      propMarketDisplay(selected);


    let line = "";


    if (
      Number.isFinite(threshold)
    ) {

      line =
        `${threshold}+`;

    } else {

      line =
        clean(
          selected.milestone
        ) ||
        clean(
          selected.outcomeLabel
        ) ||
        market;
    }


    let comparison = "";


    if (
      Number.isFinite(
        target.average
      ) &&
      Number.isFinite(
        threshold
      )
    ) {

      const difference =
        target.average -
        threshold;


      comparison =
        `${target.averageLabel}: ` +
        `${target.average.toFixed(1)} | ` +
        `Kambi: ${threshold}+ | ` +
        `Difference: ` +
        `${difference >= 0 ? "+" : ""}` +
        `${difference.toFixed(1)}`;
    }


    return {
      ...target,

      verified: true,

      status:
        "VERIFIED KAMBI MARKET",

      kambiPlayer:
        player,

      kambiMarket:
        market,

      kambiLine:
        line,

      kambiPrice:
        price,

      comparison,

      marketId:
        clean(
          selected.marketId ??
          selected.market_id
        ),

      outcomeId:
        clean(
          selected.outcomeId ??
          selected.outcome_id
        )
    };
  }


  // ============================================================
  // CONNECT ALL TARGETS
  // ============================================================

  function buildConnectedTargets() {

    const targets =
      buildTargets();


    if (!kambiData) {

      return targets.map(target => ({
        ...target,

        verified: false,

        status:
          "KAMBI DATA NOT LOADED"
      }));
    }


    const event =
      findSelectedKambiEvent();


    if (!event) {

      return targets.map(target => ({
        ...target,

        verified: false,

        status:
          "NO KAMBI EVENT FOR MATCHUP"
      }));
    }


    const eventProps =
      propsForEvent(event);


    return targets.map(target =>
      connectTargetToKambi(
        target,
        eventProps
      )
    );
  }


  // ============================================================
  // SAVE VERIFIED PLAYER MARKET
  // ============================================================

  async function saveTarget(
    target,
    button
  ) {

    if (!target.verified) {

      alert(
        "This target does not have a verified Kambi market."
      );

      return;
    }


    const matchup =
      getMatchup();


    if (!matchup) {

      alert(
        "Choose both teams first."
      );

      return;
    }


    const record = {

      type:
        "playerReceipt",

      timestamp:
        new Date().toISOString(),

      matchup,

      market:
        target.kambiMarket,

      selection:
        `${target.kambiPlayer || target.player} — ${target.kambiLine}`,

      sportsbookLine:
        target.kambiLine,

      price:
        target.kambiPrice,

      /*
        This is deliberately labeled as
        a historical War Room average,
        not a predictive projection.
      */

      warRoomProjection:
        Number.isFinite(
          target.average
        )
          ? `${target.averageLabel}: ${target.average.toFixed(1)}`
          : "Scoring opportunity profile",

      calculatedEdge:
        target.comparison || "",

      status:
        "KAMBI VERIFIED — REVIEW",

      reason:
        `${target.reason} ${target.evidence}` +
        (
          target.comparison
            ? ` ${target.comparison}`
            : ""
        ),

      actualResult:
        "",

      finalOutcome:
        "",

      postgameNotes:
        ""
    };


    const oldText =
      button.textContent;


    try {

      button.disabled = true;

      button.textContent =
        "SAVING...";


      const response =
        await fetch(
          RECORDS_URL,
          {
            method: "POST",

            body:
              JSON.stringify(record)
          }
        );


      const result =
        await response.json();


      if (
        result.status !==
        "success"
      ) {

        throw new Error(
          result.message ||
          "Save failed."
        );
      }


      button.textContent =
        "SAVED ✓";


    } catch (error) {

      console.error(
        "Player Receipt save error:",
        error
      );


      button.disabled = false;

      button.textContent =
        oldText;


      alert(
        "Player Receipt did not save. " +
        error.message
      );
    }
  }


  // ============================================================
  // CARD
  // ============================================================

  function targetCard(
    target,
    index
  ) {

    const status =
      target.verified
        ? "🟢 VERIFIED KAMBI MARKET"
        : `🟨 ${target.status}`;


    const kambiSection =
      target.verified
        ? `
          <div class="player-receipt-kambi">

            <strong>Kambi Player:</strong>
            ${escapeHtml(
              target.kambiPlayer
            )}
            <br>

            <strong>Kambi Market:</strong>
            ${escapeHtml(
              target.kambiMarket
            )}
            <br>

            <strong>Kambi Line:</strong>
            ${escapeHtml(
              target.kambiLine
            )}
            <br>

            <strong>American Price:</strong>
            ${escapeHtml(
              target.kambiPrice || "—"
            )}

          </div>

          ${
            target.comparison
              ? `
                <div class="player-receipt-comparison">

                  <strong>
                    War Room Comparison:
                  </strong>
                  <br>

                  ${escapeHtml(
                    target.comparison
                  )}

                </div>
              `
              : ""
          }

          <button
            type="button"
            class="player-receipt-save"
            data-target-index="${index}"
          >
            SAVE VERIFIED MARKET TO PLAYER RECEIPT
          </button>
        `
        : `
          <div class="player-receipt-no-market">

            No sportsbook market is being
            invented for this target.

          </div>
        `;


    return `
      <div
        class="
          player-receipt-card
          ${
            target.verified
              ? "player-receipt-verified"
              : ""
          }
        "
      >

        <div class="player-receipt-status">
          ${escapeHtml(status)}
        </div>

        <div class="player-receipt-label">
          ${escapeHtml(
            target.label
          )}
        </div>

        <div class="player-receipt-player">
          ${escapeHtml(
            target.player
          )}
        </div>

        <div class="player-receipt-team">

          ${escapeHtml(
            displayTeam(target.team)
          )}

          vs

          ${escapeHtml(
            displayTeam(
              target.opponent
            )
          )}

        </div>

        <div class="player-receipt-market">
          ${escapeHtml(
            target.originalMarket
          )}
        </div>

        <div class="player-receipt-evidence">

          <strong>
            War Room Evidence:
          </strong>

          <br>

          ${escapeHtml(
            target.evidence
          )}

        </div>

        <div class="player-receipt-reason">

          <strong>
            Why it made the Receipt:
          </strong>

          <br>

          ${escapeHtml(
            target.reason
          )}

        </div>

        ${kambiSection}

      </div>
    `;
  }


  // ============================================================
  // RENDER
  // ============================================================

  async function renderPlayerReceipt() {

    const content =
      document.getElementById(
        "playerReceiptContent"
      );


    if (!content) {
      return;
    }


    const matchup =
      getMatchup();


    if (!matchup) {

      content.innerHTML = `
        <div class="player-receipt-empty">

          Choose two different teams to
          build the Player Props Receipt.

        </div>
      `;

      return;
    }


    content.innerHTML = `
      <div class="player-receipt-empty">

        Loading War Room targets and
        verified Kambi markets...

      </div>
    `;


    await loadKambiData();


    const targets =
      buildConnectedTargets();


    if (!targets.length) {

      content.innerHTML = `
        <div class="player-receipt-empty">

          Player tables have not loaded yet.

        </div>
      `;

      return;
    }


    const event =
      kambiData
        ? findSelectedKambiEvent()
        : null;


    let eventHtml = "";


    if (event) {

      eventHtml = `
        <div class="player-receipt-event">

          Kambi event:

          <strong>
            ${escapeHtml(
              event.name
            )}
          </strong>

        </div>
      `;

    } else {

      eventHtml = `
        <div class="player-receipt-warning">

          ${
            kambiLoadError
              ? `Kambi data error: ${escapeHtml(kambiLoadError)}`
              : "No exact Kambi event was found for this selected matchup."
          }

        </div>
      `;
    }


    const verifiedCount =
      targets.filter(
        target =>
          target.verified
      ).length;


    content.innerHTML = `

      <div class="player-receipt-matchup">
        ${escapeHtml(matchup)}
      </div>

      ${eventHtml}

      <div class="player-receipt-note">

        War Room identifies the player
        opportunity. Kambi supplies the
        sportsbook market and price.

        <br><br>

        <strong>
          ${verifiedCount}
        </strong>

        of

        <strong>
          ${targets.length}
        </strong>

        War Room targets currently have
        a verified Kambi market attached.

        <br><br>

        Green means the player and Kambi
        market were matched. It does not
        automatically mean the prop is a bet.

      </div>

      <div class="player-receipt-grid">

        ${targets
          .map(
            (target, index) =>
              targetCard(
                target,
                index
              )
          )
          .join("")}

      </div>
    `;


    content
      .querySelectorAll(
        ".player-receipt-save"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset
                  .targetIndex
              );


            const target =
              targets[index];


            if (!target) {
              return;
            }


            saveTarget(
              target,
              button
            );
          }
        );
      });
  }


  // ============================================================
  // PANEL
  // ============================================================

  function createPlayerReceiptPanel() {

    if (
      document.getElementById(
        "playerReceiptPanel"
      )
    ) {
      return;
    }


    const panel =
      document.createElement("div");


    panel.id =
      "playerReceiptPanel";


    panel.className =
      "panel";


    panel.innerHTML = `

      <h2>
        👤 Player Props Receipt
      </h2>

      <p>
        Strongest War Room player opportunities
        matched against verified Kambi markets.
      </p>

      <button
        type="button"
        id="buildPlayerReceipt"
        class="player-receipt-build"
      >
        BUILD PLAYER PROPS RECEIPT
      </button>

      <div
        id="playerReceiptContent"
      ></div>
    `;


    const gameReceipt =
      document.getElementById(
        "receiptPanel"
      );


    const recordsPanel =
      document.getElementById(
        "recordsPanel"
      );


    if (
      gameReceipt &&
      gameReceipt.parentNode
    ) {

      gameReceipt.insertAdjacentElement(
        "afterend",
        panel
      );

    } else if (
      recordsPanel &&
      recordsPanel.parentNode
    ) {

      recordsPanel.insertAdjacentElement(
        "beforebegin",
        panel
      );

    } else {

      const container =
        document.querySelector(
          ".container"
        ) ||
        document.body;


      container.appendChild(
        panel
      );
    }


    addStyles();


    const button =
      document.getElementById(
        "buildPlayerReceipt"
      );


    if (button) {

      button.addEventListener(
        "click",
        renderPlayerReceipt
      );
    }


    renderPlayerReceipt();
  }


  // ============================================================
  // STYLES
  // ============================================================

  function addStyles() {

    if (
      document.getElementById(
        "playerReceiptStyles"
      )
    ) {
      return;
    }


    const style =
      document.createElement("style");


    style.id =
      "playerReceiptStyles";


    style.textContent = `

      #playerReceiptPanel {
        margin-top: 22px;
      }

      .player-receipt-build {
        border: 0;
        border-radius: 8px;
        padding: 11px 16px;
        font-weight: 800;
        cursor: pointer;
        margin: 8px 0 16px;
      }

      .player-receipt-matchup {
        font-size: 18px;
        font-weight: 900;
        margin-bottom: 10px;
      }

      .player-receipt-event {
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        background:
          rgba(53,223,147,.12);
      }

      .player-receipt-warning {
        padding: 10px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        background:
          rgba(255,210,70,.12);
      }

      .player-receipt-note {
        line-height: 1.5;
        margin-bottom: 16px;
      }

      .player-receipt-grid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(280px,1fr)
          );
        gap: 14px;
      }

      .player-receipt-card {
        border:
          2px solid
          rgba(255,210,70,.75);
        border-radius: 12px;
        padding: 16px;
        background:
          rgba(255,210,70,.07);
      }

      .player-receipt-verified {
        border-color:
          rgba(53,223,147,.85);
        background:
          rgba(53,223,147,.07);
      }

      .player-receipt-status {
        display: inline-block;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 10px;
        background:
          rgba(255,210,70,.20);
      }

      .player-receipt-verified
      .player-receipt-status {
        background:
          rgba(53,223,147,.20);
      }

      .player-receipt-label {
        font-size: 13px;
        font-weight: 900;
        margin-bottom: 5px;
      }

      .player-receipt-player {
        font-size: 24px;
        font-weight: 900;
        margin-bottom: 3px;
      }

      .player-receipt-team {
        font-size: 13px;
        opacity: .85;
        margin-bottom: 10px;
      }

      .player-receipt-market {
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 12px;
      }

      .player-receipt-evidence,
      .player-receipt-reason,
      .player-receipt-kambi,
      .player-receipt-comparison,
      .player-receipt-no-market {
        line-height: 1.5;
        margin-top: 12px;
      }

      .player-receipt-kambi {
        padding: 12px;
        border-radius: 8px;
        background:
          rgba(53,223,147,.10);
      }

      .player-receipt-comparison {
        padding: 10px;
        border-radius: 8px;
        background:
          rgba(255,255,255,.05);
      }

      .player-receipt-save {
        width: 100%;
        margin-top: 14px;
        border: 0;
        border-radius: 8px;
        padding: 11px;
        font-weight: 900;
        cursor: pointer;
      }

      .player-receipt-save:disabled {
        opacity: .75;
        cursor: default;
      }

      .player-receipt-empty {
        padding: 16px;
        border-radius: 10px;
        opacity: .88;
      }

    `;


    document.head.appendChild(
      style
    );
  }


  // ============================================================
  // WATCH TABLES
  // ============================================================

  function watchTable(bodyId) {

    const body =
      document.getElementById(bodyId);


    if (!body) {
      return;
    }


    const observer =
      new MutationObserver(() => {

        window.clearTimeout(
          body._playerReceiptTimer
        );


        body._playerReceiptTimer =
          window.setTimeout(
            renderPlayerReceipt,
            250
          );
      });


    observer.observe(
      body,
      {
        childList: true,
        subtree: true,
        characterData: true
      }
    );
  }


  function watchTeamSelectors() {

    ["away", "home"]
      .forEach(id => {

        const select =
          document.getElementById(id);


        if (!select) {
          return;
        }


        select.addEventListener(
          "change",
          () => {

            window.setTimeout(
              renderPlayerReceipt,
              300
            );
          }
        );
      });
  }


  // ============================================================
  // START
  // ============================================================

  function init() {

    createPlayerReceiptPanel();


    watchTable(
      "qbPassingBody"
    );

    watchTable(
      "targetBody"
    );

    watchTable(
      "rushingBody"
    );

    watchTable(
      "defenseBody"
    );


    watchTeamSelectors();


    loadKambiData();


    window.setTimeout(
      renderPlayerReceipt,
      700
    );


    window.setTimeout(
      renderPlayerReceipt,
      1800
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();
  }

})();
