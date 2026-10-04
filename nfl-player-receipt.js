// ============================================================
// DOC'S NFL WAR ROOM
// PLAYER PROP RECEIPT — KAMBI CONNECTED
//
// PURPOSE:
// 1. Find strongest player opportunities from War Room
// 2. Match those players to the selected Kambi NFL event
// 3. Show VERIFIED Kambi prop markets + American prices
// 4. Never invent a player, market, threshold, or price
//
// DESTINATION:
// Google Sheet tab: Player Receipt
// type: playerReceipt
// ============================================================

(() => {
  "use strict";

  const RECORDS_URL =
    "https://script.google.com/macros/s/AKfycbxovg8I9EhY3QNZ5Bl81jJDJiQ_Ddr4NwNIyO3lXiNmr0qq5w06hj7dA1DBjuuDUfHI/exec";

  const KAMBI_URL =
    "data/kambi-player-props-2026.json";


  // ============================================================
  // TEAM INFORMATION
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


  const KAMBI_TEAM_ALIASES = {
    ARI: [
      "ARI",
      "Arizona",
      "Arizona Cardinals",
      "ARI Cardinals"
    ],

    ATL: [
      "ATL",
      "Atlanta",
      "Atlanta Falcons",
      "ATL Falcons"
    ],

    BAL: [
      "BAL",
      "Baltimore",
      "Baltimore Ravens",
      "BAL Ravens"
    ],

    BUF: [
      "BUF",
      "Buffalo",
      "Buffalo Bills",
      "BUF Bills"
    ],

    CAR: [
      "CAR",
      "Carolina",
      "Carolina Panthers",
      "CAR Panthers"
    ],

    CHI: [
      "CHI",
      "Chicago",
      "Chicago Bears",
      "CHI Bears"
    ],

    CIN: [
      "CIN",
      "Cincinnati",
      "Cincinnati Bengals",
      "CIN Bengals"
    ],

    CLE: [
      "CLE",
      "Cleveland",
      "Cleveland Browns",
      "CLE Browns"
    ],

    DAL: [
      "DAL",
      "Dallas",
      "Dallas Cowboys",
      "DAL Cowboys"
    ],

    DEN: [
      "DEN",
      "Denver",
      "Denver Broncos",
      "DEN Broncos"
    ],

    DET: [
      "DET",
      "Detroit",
      "Detroit Lions",
      "DET Lions"
    ],

    GB: [
      "GB",
      "Green Bay",
      "Green Bay Packers",
      "GB Packers"
    ],

    HOU: [
      "HOU",
      "Houston",
      "Houston Texans",
      "HOU Texans"
    ],

    IND: [
      "IND",
      "Indianapolis",
      "Indianapolis Colts",
      "IND Colts"
    ],

    JAX: [
      "JAX",
      "Jacksonville",
      "Jacksonville Jaguars",
      "JAX Jaguars"
    ],

    KC: [
      "KC",
      "Kansas City",
      "Kansas City Chiefs",
      "KC Chiefs"
    ],

    LV: [
      "LV",
      "Las Vegas",
      "Las Vegas Raiders",
      "LV Raiders"
    ],

    LAC: [
      "LAC",
      "LA Chargers",
      "Los Angeles Chargers"
    ],

    LAR: [
      "LAR",
      "LA Rams",
      "Los Angeles Rams"
    ],

    MIA: [
      "MIA",
      "Miami",
      "Miami Dolphins",
      "MIA Dolphins"
    ],

    MIN: [
      "MIN",
      "Minnesota",
      "Minnesota Vikings",
      "MIN Vikings"
    ],

    NE: [
      "NE",
      "New England",
      "New England Patriots",
      "NE Patriots"
    ],

    NO: [
      "NO",
      "New Orleans",
      "New Orleans Saints",
      "NO Saints"
    ],

    NYG: [
      "NYG",
      "NY Giants",
      "New York Giants"
    ],

    NYJ: [
      "NYJ",
      "NY Jets",
      "New York Jets"
    ],

    PHI: [
      "PHI",
      "Philadelphia",
      "Philadelphia Eagles",
      "PHI Eagles"
    ],

    PIT: [
      "PIT",
      "Pittsburgh",
      "Pittsburgh Steelers",
      "PIT Steelers"
    ],

    SEA: [
      "SEA",
      "Seattle",
      "Seattle Seahawks",
      "SEA Seahawks"
    ],

    SF: [
      "SF",
      "San Francisco",
      "San Francisco 49ers",
      "SF 49ers"
    ],

    TB: [
      "TB",
      "Tampa Bay",
      "Tampa Bay Buccaneers",
      "TB Buccaneers"
    ],

    TEN: [
      "TEN",
      "Tennessee",
      "Tennessee Titans",
      "TEN Titans"
    ],

    WAS: [
      "WAS",
      "Washington",
      "Washington Commanders",
      "WAS Commanders"
    ]
  };


  // ============================================================
  // STATE
  // ============================================================

  let kambiData = null;
  let kambiError = "";
  let kambiPromise = null;


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
    const team =
      clean(code).toUpperCase();

    return TEAM_NAMES[team] || team;
  }


  function displayTeam(code) {
    const team =
      clean(code).toUpperCase();

    const name =
      fullTeamName(team);

    if (!team) {
      return "";
    }

    if (name === team) {
      return team;
    }

    return `${team} — ${name}`;
  }


  function normalizeText(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }


  function normalizePlayerName(value) {
    return clean(value)
      .toLowerCase()
      .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }


  function splitName(value) {
    const normalized =
      normalizePlayerName(value);

    const pieces =
      normalized
        .split(" ")
        .filter(Boolean);

    return {
      normalized,
      first:
        pieces[0] || "",
      last:
        pieces.length
          ? pieces[pieces.length - 1]
          : ""
    };
  }


  function samePlayer(
    warRoomName,
    kambiName
  ) {
    const war =
      splitName(warRoomName);

    const kambi =
      splitName(kambiName);

    if (
      !war.normalized ||
      !kambi.normalized
    ) {
      return false;
    }

    if (
      war.normalized ===
      kambi.normalized
    ) {
      return true;
    }

    if (
      !war.last ||
      war.last !== kambi.last
    ) {
      return false;
    }

    /*
      War Room sometimes uses:
      J.Taylor

      Kambi may use:
      Jonathan Taylor

      Require same last name AND
      matching first initial.
    */

    if (
      war.first &&
      kambi.first &&
      war.first[0] ===
      kambi.first[0]
    ) {
      return true;
    }

    return false;
  }


  function formatOdds(value) {
    const text =
      clean(value);

    if (!text) {
      return "";
    }

    if (
      text.startsWith("+") ||
      text.startsWith("-")
    ) {
      return text;
    }

    const number =
      Number(text);

    if (!Number.isFinite(number)) {
      return text;
    }

    return number > 0
      ? `+${number}`
      : String(number);
  }


  // ============================================================
  // CURRENT MATCHUP
  // ============================================================

  function getSelectedTeam(id) {
    const select =
      document.getElementById(id);

    if (!select) {
      return "";
    }

    return clean(select.value)
      .toUpperCase();
  }


  function getMatchup() {
    const away =
      getSelectedTeam("away");

    const home =
      getSelectedTeam("home");

    if (!away || !home) {
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
  // KAMBI DATA
  // ============================================================

  async function loadKambiData() {

    if (kambiData) {
      return kambiData;
    }

    if (kambiPromise) {
      return kambiPromise;
    }

    kambiPromise =
      fetch(KAMBI_URL, {
        cache: "no-store"
      })
        .then(response => {

          if (!response.ok) {
            throw new Error(
              `Kambi data returned ${response.status}.`
            );
          }

          return response.json();
        })
        .then(data => {

          if (
            !data ||
            !Array.isArray(data.events) ||
            !Array.isArray(data.props)
          ) {
            throw new Error(
              "Kambi file structure is not valid."
            );
          }

          kambiData = data;
          kambiError = "";

          console.log(
            "PLAYER RECEIPT KAMBI DATA:",
            data.counts
          );

          return data;
        })
        .catch(error => {

          kambiError =
            error.message;

          console.error(
            "Player Receipt Kambi error:",
            error
          );

          return null;
        });

    return kambiPromise;
  }


  function eventContainsTeam(
    eventName,
    teamCode
  ) {
    const aliases =
      KAMBI_TEAM_ALIASES[
        clean(teamCode).toUpperCase()
      ] || [];

    const eventNormalized =
      normalizeText(eventName);

    return aliases.some(alias => {

      const aliasNormalized =
        normalizeText(alias);

      return (
        aliasNormalized &&
        eventNormalized.includes(
          aliasNormalized
        )
      );
    });
  }


  function findSelectedKambiEvent() {

    if (!kambiData) {
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
          eventContainsTeam(
            name,
            away
          ) &&
          eventContainsTeam(
            name,
            home
          )
        );
      });

    if (matches.length !== 1) {

      if (matches.length > 1) {
        console.warn(
          "More than one Kambi event matched:",
          matches
        );
      }

      return null;
    }

    return matches[0];
  }


  function propsForSelectedEvent() {

    const event =
      findSelectedKambiEvent();

    if (!event) {
      return {
        event: null,
        props: []
      };
    }

    const props =
      kambiData.props.filter(prop =>
        String(prop.eventId) ===
        String(event.id)
      );

    return {
      event,
      props
    };
  }


  // ============================================================
  // DEFENSIVE MATCHUP DATA
  // ============================================================

  function getDefense(team) {
    const code =
      clean(team).toUpperCase();

    const rows =
      getRows("defenseBody");

    const row =
      rows.find(r =>
        clean(r[0]).toUpperCase() === code
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
  // QB DATA
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

        const completions =
          numberFrom(row[3]);

        const completionPct =
          numberFrom(row[4]);

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
          attemptsPerGame > 0 &&
          attempts > 0
        ) {
          estimatedGames =
            attempts /
            attemptsPerGame;
        }

        const passingYardsPerGame =
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
          completions,
          completionPct,
          attemptsPerGame,
          passingYards,
          passingYardsPerGame,
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
          category: "RECEIVING",
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
              ? defense.explosiveAllowedPerGame
              : 0,

          opponentYacAllowedPerGame:
            defense
              ? defense.yacAllowedPerGame
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
          category: "RUSHING",
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

          rushingYardsPerGame:
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

    const sorted =
      [...qbs].sort((a, b) => {

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
          b.passingYardsPerGame !==
          a.passingYardsPerGame
        ) {
          return (
            b.passingYardsPerGame -
            a.passingYardsPerGame
          );
        }

        return (
          b.yardsPerAttempt -
          a.yardsPerAttempt
        );
      });

    const player =
      sorted[0];

    return {
      market:
        "QB Passing Target",

      kambiType:
        "PASSING",

      label:
        "TOP QB VOLUME TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      comparisonValue:
        player.passingYardsPerGame,

      comparisonLabel:
        "Passing yards/game",

      evidence:
        `${player.attemptsPerGame.toFixed(2)} attempts/game, ` +
        `${player.passingYardsPerGame.toFixed(1)} passing yards/game, ` +
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

    const sorted =
      [...receivers].sort((a, b) => {

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
      });

    const player =
      sorted[0];

    return {
      market:
        "Receiving Volume Target",

      kambiType:
        "RECEIVING",

      label:
        "TOP RECEIVING VOLUME TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      comparisonValue:
        player.yardsPerGame,

      comparisonLabel:
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

    const sorted =
      [...receivers].sort((a, b) => {

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
      });

    const player =
      sorted[0];

    return {
      market:
        "Receiving TD / Red Zone Target",

      kambiType:
        "TOUCHDOWN",

      label:
        "TOP RECEIVING SCORING TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      comparisonValue: null,

      comparisonLabel: "",

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

    if (!receivers.length) {
      return null;
    }

    const eligible =
      receivers.filter(player =>
        player.explosiveCatches > 0
      );

    if (!eligible.length) {
      return null;
    }

    const sorted =
      [...eligible].sort((a, b) => {

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
      });

    const player =
      sorted[0];

    return {
      market:
        "Explosive Receiving Target",

      kambiType:
        "RECEIVING",

      label:
        "TOP EXPLOSIVE RECEIVING TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      comparisonValue:
        player.yardsPerGame,

      comparisonLabel:
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

    const sorted =
      [...rushers].sort((a, b) => {

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
          b.rushingYardsPerGame !==
          a.rushingYardsPerGame
        ) {
          return (
            b.rushingYardsPerGame -
            a.rushingYardsPerGame
          );
        }

        return (
          b.yardsPerCarry -
          a.yardsPerCarry
        );
      });

    const player =
      sorted[0];

    return {
      market:
        "Rushing Volume Target",

      kambiType:
        "RUSHING",

      label:
        "TOP RUSHING WORKLOAD TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      comparisonValue:
        player.rushingYardsPerGame,

      comparisonLabel:
        "Rushing yards/game",

      evidence:
        `${player.carriesPerGame.toFixed(2)} carries/game, ` +
        `${player.rushingYardsPerGame.toFixed(2)} rushing yards/game, ` +
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

    const sorted =
      [...rushers].sort((a, b) => {

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
      });

    const player =
      sorted[0];

    return {
      market:
        "Rushing TD / Red Zone Target",

      kambiType:
        "TOUCHDOWN",

      label:
        "TOP RUSHING SCORING TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      comparisonValue: null,

      comparisonLabel: "",

      evidence:
        `${player.redZoneCarries} red-zone carries, ` +
        `${player.inside10Carries} inside-10 carries, ` +
        `${player.rushingTDs} rushing TD, ` +
        `${player.carriesPerGame.toFixed(2)} carries/game.`,

      reason:
        "Strongest rushing scoring-opportunity profile based on current red-zone and inside-10 workload."
    };
  }


  function uniqueTargets(targets) {

    const seen =
      new Set();

    return targets.filter(target => {

      if (!target) {
        return false;
      }

      const key =
        `${target.market}|` +
        `${target.team}|` +
        `${target.player}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  }


  function buildTargets() {

    const qbs =
      collectQuarterbacks();

    const receivers =
      collectReceivers();

    const rushers =
      collectRushers();

    return uniqueTargets([
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
    ]);
  }


  // ============================================================
  // KAMBI MARKET MATCHING
  // ============================================================

  function propSearchText(prop) {
    return [
      prop.category,
      prop.displayMarket,
      prop.marketLabel,
      prop.shortMarketLabel,
      prop.betOfferType,
      prop.outcomeLabel
    ]
      .map(clean)
      .join(" ")
      .toLowerCase();
  }


  function isFirstHalfProp(prop) {
    const text =
      propSearchText(prop);

    return (
      text.includes("first half") ||
      text.includes("1st half")
    );
  }


  function isPassingYardsProp(prop) {
    const text =
      propSearchText(prop);

    return (
      text.includes("passing yards") &&
      !isFirstHalfProp(prop)
    );
  }


  function isReceivingYardsProp(prop) {
    const text =
      propSearchText(prop);

    return (
      text.includes("receiving yards") &&
      !isFirstHalfProp(prop)
    );
  }


  function isRushingYardsProp(prop) {
    const text =
      propSearchText(prop);

    return (
      text.includes("rushing yards") &&
      !isFirstHalfProp(prop)
    );
  }


  function isTouchdownProp(prop) {
    const text =
      propSearchText(prop);

    return (
      text.includes("touchdown") ||
      text.includes("td scorer") ||
      text.includes("to score")
    );
  }


  function marketMatchesTarget(
    prop,
    target
  ) {

    if (
      target.kambiType ===
      "PASSING"
    ) {
      return isPassingYardsProp(prop);
    }

    if (
      target.kambiType ===
      "RECEIVING"
    ) {
      return isReceivingYardsProp(prop);
    }

    if (
      target.kambiType ===
      "RUSHING"
    ) {
      return isRushingYardsProp(prop);
    }

    if (
      target.kambiType ===
      "TOUCHDOWN"
    ) {
      return isTouchdownProp(prop);
    }

    return false;
  }


  function getThreshold(prop) {

    const milestone =
      clean(prop.milestone);

    const milestoneMatch =
      milestone.match(
        /(\d+(?:\.\d+)?)\+/
      );

    if (milestoneMatch) {
      return Number(
        milestoneMatch[1]
      );
    }

    const display =
      clean(prop.displayMarket);

    const displayMatch =
      display.match(
        /(\d+(?:\.\d+)?)\+/
      );

    if (displayMatch) {
      return Number(
        displayMatch[1]
      );
    }

    return null;
  }


  function getMarketDisplay(prop) {

    const display =
      clean(prop.displayMarket);

    if (display) {
      return display;
    }

    const label =
      clean(prop.marketLabel);

    if (label) {
      return label;
    }

    const shortLabel =
      clean(prop.shortMarketLabel);

    if (shortLabel) {
      return shortLabel;
    }

    return clean(
      prop.outcomeLabel
    );
  }


  function getPlayerKambiProps(
    target,
    eventProps
  ) {

    const matches =
      eventProps.filter(prop => {

        if (
          prop.resolution !==
          "EXACT_ID_MATCH"
        ) {
          return false;
        }

        if (
          clean(prop.status)
            .toUpperCase() !==
          "OPEN"
        ) {
          return false;
        }

        if (
          !samePlayer(
            target.player,
            prop.player
          )
        ) {
          return false;
        }

        return marketMatchesTarget(
          prop,
          target
        );
      });

    /*
      Protection against ambiguous abbreviated names.

      If J.Taylor somehow matches two different
      Kambi full names inside the same event,
      we refuse the match.
    */

    const names =
      [
        ...new Set(
          matches.map(prop =>
            normalizePlayerName(
              prop.player
            )
          )
        )
      ];

    if (names.length > 1) {
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


  function chooseBestVolumeMarket(
    target,
    props
  ) {

    const ladder =
      props
        .map(prop => ({
          prop,
          threshold:
            getThreshold(prop)
        }))
        .filter(item =>
          Number.isFinite(
            item.threshold
          )
        );

    if (!ladder.length) {
      return null;
    }

    const comparison =
      Number(
        target.comparisonValue
      );

    if (!Number.isFinite(comparison)) {
      return ladder[0].prop;
    }

    /*
      Choose the available Kambi milestone
      nearest the player's War Room average.

      This is a comparison point.
      It is NOT being called a projected probability.
    */

    ladder.sort((a, b) => {

      const aDistance =
        Math.abs(
          comparison -
          a.threshold
        );

      const bDistance =
        Math.abs(
          comparison -
          b.threshold
        );

      if (
        aDistance !==
        bDistance
      ) {
        return (
          aDistance -
          bDistance
        );
      }

      return (
        a.threshold -
        b.threshold
      );
    });

    return ladder[0].prop;
  }


  function chooseTouchdownMarket(
    props
  ) {

    if (!props.length) {
      return null;
    }

    /*
      Prefer a simple touchdown scorer
      market over specialized multi-TD
      or period-specific markets.
    */

    const ranked =
      [...props].sort((a, b) => {

        const aText =
          propSearchText(a);

        const bText =
          propSearchText(b);

        function score(text) {

          let value = 0;

          if (
            text.includes(
              "anytime"
            )
          ) {
            value += 10;
          }

          if (
            text.includes(
              "touchdown scorer"
            )
          ) {
            value += 8;
          }

          if (
            text.includes(
              "to score"
            )
          ) {
            value += 5;
          }

          if (
            text.includes(
              "first touchdown"
            )
          ) {
            value -= 10;
          }

          if (
            text.includes(
              "last touchdown"
            )
          ) {
            value -= 10;
          }

          if (
            text.includes(
              "2+"
            ) ||
            text.includes(
              "3+"
            )
          ) {
            value -= 8;
          }

          if (
            text.includes(
              "first half"
            )
          ) {
            value -= 8;
          }

          return value;
        }

        return (
          score(bText) -
          score(aText)
        );
      });

    return ranked[0];
  }


  function attachKambiMarket(
    target,
    eventProps
  ) {

    const lookup =
      getPlayerKambiProps(
        target,
        eventProps
      );

    if (lookup.ambiguous) {

      return {
        ...target,

        kambiStatus:
          "AMBIGUOUS PLAYER MATCH",

        kambiVerified: false,

        kambiMarket: "",

        kambiLine: "",

        kambiPrice: "",

        kambiPlayer: ""
      };
    }

    if (!lookup.props.length) {

      return {
        ...target,

        kambiStatus:
          "NO VERIFIED KAMBI MARKET",

        kambiVerified: false,

        kambiMarket: "",

        kambiLine: "",

        kambiPrice: "",

        kambiPlayer: ""
      };
    }


    let selected = null;

    if (
      target.kambiType ===
      "TOUCHDOWN"
    ) {
      selected =
        chooseTouchdownMarket(
          lookup.props
        );
    } else {
      selected =
        chooseBestVolumeMarket(
          target,
          lookup.props
        );
    }


    if (!selected) {

      return {
        ...target,

        kambiStatus:
          "NO COMPARABLE KAMBI LINE",

        kambiVerified: false,

        kambiMarket: "",

        kambiLine: "",

        kambiPrice: "",

        kambiPlayer: ""
      };
    }


    const threshold =
      getThreshold(selected);

    const marketDisplay =
      getMarketDisplay(selected);

    const price =
      formatOdds(
        selected.americanOdds
      );


    let comparisonText = "";

    if (
      Number.isFinite(
        target.comparisonValue
      ) &&
      Number.isFinite(
        threshold
      )
    ) {

      const difference =
        target.comparisonValue -
        threshold;

      comparisonText =
        `${target.comparisonLabel}: ` +
        `${target.comparisonValue.toFixed(1)} | ` +
        `Kambi milestone: ${threshold}+ | ` +
        `Difference: ` +
        `${difference >= 0 ? "+" : ""}` +
        `${difference.toFixed(1)}`;
    }


    return {
      ...target,

      kambiStatus:
        "VERIFIED KAMBI MARKET",

      kambiVerified: true,

      kambiMarket:
        marketDisplay,

      kambiLine:
        clean(selected.milestone) ||
        marketDisplay,

      kambiPrice:
        price,

      kambiPlayer:
        clean(selected.player),

      kambiMarketId:
        clean(selected.marketId),

      kambiOutcomeId:
        clean(selected.outcomeId),

      comparisonText
    };
  }


  // ============================================================
  // BUILD KAMBI-CONNECTED TARGETS
  // ============================================================

  function buildConnectedTargets() {

    const targets =
      buildTargets();

    if (!kambiData) {
      return targets.map(target => ({
        ...target,

        kambiStatus:
          "KAMBI DATA NOT LOADED",

        kambiVerified: false
      }));
    }


    const {
      event,
      props
    } =
      propsForSelectedEvent();


    if (!event) {

      return targets.map(target => ({
        ...target,

        kambiStatus:
          "NO KAMBI EVENT FOR MATCHUP",

        kambiVerified: false
      }));
    }


    return targets.map(target =>
      attachKambiMarket(
        target,
        props
      )
    );
  }


  // ============================================================
  // SAVE PLAYER TARGET
  // ============================================================

  async function saveTarget(
    target,
    button
  ) {

    const matchup =
      getMatchup();

    if (!matchup) {

      alert(
        "Choose both teams before saving a Player Receipt target."
      );

      return;
    }


    if (!target.kambiVerified) {

      alert(
        "This player does not have a verified Kambi market attached. It will not be saved as a sportsbook selection."
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
        target.kambiMarket ||
        target.market,

      selection:
        `${target.kambiPlayer || target.player} — ` +
        `${target.kambiLine}`,

      sportsbookLine:
        target.kambiLine,

      price:
        target.kambiPrice,

      /*
        IMPORTANT:
        This remains a historical average/profile,
        NOT a predictive player projection.
      */

      warRoomProjection:
        Number.isFinite(
          target.comparisonValue
        )
          ? `${target.comparisonLabel}: ` +
            `${target.comparisonValue.toFixed(1)}`
          : "Scoring opportunity profile",

      calculatedEdge:
        target.comparisonText || "",

      status:
        "KAMBI VERIFIED — REVIEW",

      reason:
        `${target.reason} ${target.evidence}` +
        (
          target.comparisonText
            ? ` ${target.comparisonText}`
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
              JSON.stringify(
                record
              )
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

      button.classList.add(
        "player-receipt-saved"
      );


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
  // CARD HTML
  // ============================================================

  function targetCard(
    target,
    index
  ) {

    const verified =
      target.kambiVerified;


    const statusText =
      verified
        ? "🟢 VERIFIED KAMBI MARKET"
        : `🟨 ${target.kambiStatus || "NO VERIFIED MARKET"}`;


    const marketSection =
      verified
        ? `
          <div class="player-receipt-kambi">

            <strong>
              Kambi Player:
            </strong>
            ${escapeHtml(
              target.kambiPlayer
            )}
            <br>

            <strong>
              Kambi Market:
            </strong>
            ${escapeHtml(
              target.kambiMarket
            )}
            <br>

            <strong>
              Kambi Line:
            </strong>
            ${escapeHtml(
              target.kambiLine
            )}
            <br>

            <strong>
              American Price:
            </strong>
            ${escapeHtml(
              target.kambiPrice || "—"
            )}

          </div>

          ${
            target.comparisonText
              ? `
                <div class="player-receipt-comparison">
                  <strong>
                    War Room Comparison:
                  </strong>
                  <br>
                  ${escapeHtml(
                    target.comparisonText
                  )}
                </div>
              `
              : ""
          }
        `
        : `
          <div class="player-receipt-line">
            No verified Kambi market was attached.
            The War Room will not invent one.
          </div>
        `;


    const buttonSection =
      verified
        ? `
          <button
            type="button"
            class="player-receipt-save"
            data-target-index="${index}"
          >
            SAVE VERIFIED MARKET TO PLAYER RECEIPT
          </button>
        `
        : "";


    return `
      <div class="
        player-receipt-card
        ${
          verified
            ? "player-receipt-verified"
            : ""
        }
      ">

        <div class="player-receipt-status">
          ${escapeHtml(statusText)}
        </div>

        <div class="player-receipt-label">
          ${escapeHtml(target.label)}
        </div>

        <div class="player-receipt-player">
          ${escapeHtml(target.player)}
        </div>

        <div class="player-receipt-team">
          ${escapeHtml(
            displayTeam(target.team)
          )}
          vs
          ${escapeHtml(
            displayTeam(target.opponent)
          )}
        </div>

        <div class="player-receipt-market">
          ${escapeHtml(target.market)}
        </div>

        <div class="player-receipt-evidence">
          <strong>
            War Room Evidence:
          </strong>
          <br>
          ${escapeHtml(target.evidence)}
        </div>

        <div class="player-receipt-reason">
          <strong>
            Why it made the Receipt:
          </strong>
          <br>
          ${escapeHtml(target.reason)}
        </div>

        ${marketSection}

        ${buttonSection}

      </div>
    `;
  }


  // ============================================================
  // RENDER PLAYER RECEIPT
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
          Choose both teams to build the Player Props Receipt.
        </div>
      `;

      return;
    }


    content.innerHTML = `
      <div class="player-receipt-empty">
        Loading verified Kambi markets...
      </div>
    `;


    await loadKambiData();


    const targets =
      buildConnectedTargets();


    if (!targets.length) {

      content.innerHTML = `
        <div class="player-receipt-empty">
          Player data has not loaded yet.
        </div>
      `;

      return;
    }


    const selectedEvent =
      kambiData
        ? findSelectedKambiEvent()
        : null;


    const eventMessage =
      selectedEvent
        ? `
          <div class="player-receipt-kambi-event">
            Kambi event:
            <strong>
              ${escapeHtml(
                selectedEvent.name
              )}
            </strong>
          </div>
        `
        : `
          <div class="player-receipt-kambi-warning">
            ${
              kambiError
                ? `Kambi data error: ${escapeHtml(kambiError)}`
                : "No exact Kambi event was found for this selected matchup."
            }
          </div>
        `;


    const verifiedCount =
      targets.filter(
        target =>
          target.kambiVerified
      ).length;


    content.innerHTML = `

      <div class="player-receipt-matchup">
        ${escapeHtml(matchup)}
      </div>

      ${eventMessage}

      <div class="player-receipt-note">

        War Room identifies the player opportunity.
        Kambi supplies the sportsbook market and price.

        <br><br>

        <strong>
          ${verifiedCount}
        </strong>
        of
        <strong>
          ${targets.length}
        </strong>
        War Room targets currently have a verified
        Kambi market attached.

        <br><br>

        A green card means the Kambi market and price
        were matched to the player using the exact
        event data. It does <strong>not</strong>
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
  // CREATE PLAYER RECEIPT PANEL
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
        War Room player opportunities matched
        against verified Kambi NFL player markets.
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


    const postgamePanel =
      Array.from(
        document.querySelectorAll(
          ".panel"
        )
      ).find(panelElement =>
        clean(
          panelElement
            .querySelector("h2")
            ?.textContent
        )
          .toLowerCase()
          .includes(
            "postgame evaluation"
          )
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

    } else if (
      postgamePanel &&
      postgamePanel.parentNode
    ) {

      postgamePanel.insertAdjacentElement(
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


    addPlayerReceiptStyles();


    const buildButton =
      document.getElementById(
        "buildPlayerReceipt"
      );


    if (buildButton) {

      buildButton.addEventListener(
        "click",
        renderPlayerReceipt
      );
    }
  }


  // ============================================================
  // STYLES
  // ============================================================

  function addPlayerReceiptStyles() {

    if (
      document.getElementById(
        "playerReceiptStyles"
      )
    ) {
      return;
    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "playerReceiptStyles";


    style.textContent = `

      #playerReceiptPanel {
        margin-top: 22px;
      }

      #playerReceiptPanel h2 {
        margin-bottom: 8px;
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
        font-weight: 800;
        margin-bottom: 10px;
      }

      .player-receipt-note {
        line-height: 1.5;
        margin-bottom: 16px;
        opacity: 0.92;
      }

      .player-receipt-kambi-event {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        background:
          rgba(53, 223, 147, 0.10);
      }

      .player-receipt-kambi-warning {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        background:
          rgba(255, 210, 70, 0.10);
      }

      .player-receipt-grid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(280px, 1fr)
          );
        gap: 14px;
      }

      .player-receipt-card {
        border:
          2px solid
          rgba(255, 210, 70, 0.75);
        border-radius: 12px;
        padding: 16px;
        background:
          rgba(255, 210, 70, 0.08);
      }

      .player-receipt-card.player-receipt-verified {
        border-color:
          rgba(53, 223, 147, 0.85);
        background:
          rgba(53, 223, 147, 0.07);
      }

      .player-receipt-status {
        display: inline-block;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 10px;
        background:
          rgba(255, 210, 70, 0.20);
      }

      .player-receipt-verified
      .player-receipt-status {
        background:
          rgba(53, 223, 147, 0.20);
      }

      .player-receipt-label {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.4px;
        margin-bottom: 5px;
      }

      .player-receipt-player {
        font-size: 24px;
        font-weight: 900;
        margin-bottom: 3px;
      }

      .player-receipt-team {
        font-size: 13px;
        opacity: 0.85;
        margin-bottom: 10px;
      }

      .player-receipt-market {
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 12px;
      }

      .player-receipt-evidence,
      .player-receipt-reason,
      .player-receipt-line,
      .player-receipt-kambi,
      .player-receipt-comparison {
        line-height: 1.5;
        margin-top: 12px;
      }

      .player-receipt-kambi {
        padding: 12px;
        border-radius: 8px;
        background:
          rgba(53, 223, 147, 0.10);
      }

      .player-receipt-comparison {
        padding: 10px;
        border-radius: 8px;
        background:
          rgba(255, 255, 255, 0.05);
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
        cursor: default;
        opacity: 0.75;
      }

      .player-receipt-saved {
        font-weight: 900;
      }

      .player-receipt-empty {
        padding: 16px;
        border-radius: 10px;
        opacity: 0.85;
      }

    `;


    document.head.appendChild(
      style
    );
  }


  // ============================================================
  // WATCH WAR ROOM TABLES
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
            200
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


  // ============================================================
  // TEAM SELECTOR WATCHERS
  // ============================================================

  function watchTeamSelectors() {

    ["away", "home"]
      .forEach(id => {

        const element =
          document.getElementById(id);

        if (!element) {
          return;
        }


        element.addEventListener(
          "change",
          () => {

            window.setTimeout(
              renderPlayerReceipt,
              250
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


    /*
      Begin loading Kambi in the background.
      Do not block the rest of the War Room.
    */

    loadKambiData();


    window.setTimeout(
      renderPlayerReceipt,
      600
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
