// ============================================================
// DOC'S NFL WAR ROOM
// PLAYER PROP RECEIPT
//
// PURPOSE:
// Pull the strongest player opportunities from the War Room.
//
// IMPORTANT:
// This file DOES NOT invent sportsbook prop lines.
// Until a real player prop line is connected, every candidate
// is a RESEARCH TARGET / CHECK LINE.
//
// DESTINATION:
// Google Sheet tab: Player Receipt
// type: playerReceipt
// ============================================================

(() => {
  "use strict";

  const RECORDS_URL =
    "https://script.google.com/macros/s/AKfycbxovg8I9EhY3QNZ5Bl81jJDJiQ_Ddr4NwNIyO3lXiNmr0qq5w06hj7dA1DBjuuDUfHI/exec";


  // ============================================================
  // TEAM NAMES
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


  // ============================================================
  // BASIC HELPERS
  // ============================================================

  function clean(value) {
    return String(value ?? "").trim();
  }


  function numberFrom(value) {
    const match =
      clean(value)
        .replace(/,/g, "")
        .match(/-?\d+(\.\d+)?/);

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
      games: numberFrom(row[1]),
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
          player: clean(row[1]),
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
          player: clean(row[1]),

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
  // PLAYER TARGET SELECTION
  //
  // We intentionally use transparent football categories
  // instead of inventing a fake "edge" percentage.
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

      label:
        "TOP QB VOLUME TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

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


  function bestReceiverVolumeTarget(receivers) {
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

      label:
        "TOP RECEIVING VOLUME TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

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

      label:
        "TOP RECEIVING SCORING TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

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

      label:
        "TOP EXPLOSIVE RECEIVING TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

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

      label:
        "TOP RUSHING WORKLOAD TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

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

      label:
        "TOP RUSHING SCORING TARGET",

      player:
        player.player,

      team:
        player.team,

      opponent:
        player.opponent,

      evidence:
        `${player.redZoneCarries} red-zone carries, ` +
        `${player.inside10Carries} inside-10 carries, ` +
        `${player.rushingTDs} rushing TD, ` +
        `${player.carriesPerGame.toFixed(2)} carries/game.`,

      reason:
        "Strongest rushing scoring-opportunity profile based on current red-zone and inside-10 workload."
    };
  }


  // ============================================================
  // REMOVE DUPLICATE PLAYER/MARKET TARGETS
  // ============================================================

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


  // ============================================================
  // BUILD TARGET LIST
  // ============================================================

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


    const record = {

      type:
        "playerReceipt",

      timestamp:
        new Date().toISOString(),

      matchup,

      market:
        target.market,

      selection:
        `${target.player} — ${target.team}`,

      sportsbookLine:
        "CHECK LINE",

      price:
        "",

      warRoomProjection:
        "",

      calculatedEdge:
        "",

      status:
        "PROP TARGET — CHECK LINE",

      reason:
        `${target.reason} ${target.evidence}`,

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

    return `
      <div class="player-receipt-card">

        <div class="player-receipt-status">
          🟨 PROP TARGET — CHECK LINE
        </div>

        <div class="player-receipt-label">
          ${escapeHtml(target.label)}
        </div>

        <div class="player-receipt-player">
          ${escapeHtml(target.player)}
        </div>

        <div class="player-receipt-team">
          ${escapeHtml(displayTeam(target.team))}
          vs
          ${escapeHtml(displayTeam(target.opponent))}
        </div>

        <div class="player-receipt-market">
          ${escapeHtml(target.market)}
        </div>

        <div class="player-receipt-evidence">
          <strong>War Room Evidence:</strong><br>
          ${escapeHtml(target.evidence)}
        </div>

        <div class="player-receipt-reason">
          <strong>Why it made the Receipt:</strong><br>
          ${escapeHtml(target.reason)}
        </div>

        <div class="player-receipt-line">
          Sportsbook Prop Line:
          <strong>CHECK LINE</strong>
        </div>

        <button
          type="button"
          class="player-receipt-save"
          data-target-index="${index}"
        >
          SAVE TARGET TO PLAYER RECEIPT
        </button>

      </div>
    `;
  }


  // ============================================================
  // RENDER PLAYER RECEIPT
  // ============================================================

  function renderPlayerReceipt() {
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


    const targets =
      buildTargets();


    if (!targets.length) {

      content.innerHTML = `
        <div class="player-receipt-empty">
          Player data has not loaded yet.
          The Player Receipt will build automatically
          when the QB, receiver, and rushing tables are ready.
        </div>
      `;

      return;
    }


    content.innerHTML = `

      <div class="player-receipt-matchup">
        ${escapeHtml(matchup)}
      </div>

      <div class="player-receipt-note">
        These are the strongest player opportunities
        found in the current War Room data.
        They are <strong>not official bets yet</strong>.
        We still need the actual sportsbook prop line.
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
        The strongest QB, receiving, rushing,
        and scoring-opportunity targets found
        by Doc's NFL War Room.
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


    /*
      Put Player Props Receipt directly
      after the existing Game Receipt.
    */

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


    renderPlayerReceipt();
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
        opacity: 0.9;
      }

      .player-receipt-grid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(260px, 1fr)
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
      .player-receipt-line {
        line-height: 1.45;
        margin-top: 10px;
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
            150
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
              200
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


    window.setTimeout(
      renderPlayerReceipt,
      500
    );

    window.setTimeout(
      renderPlayerReceipt,
      1500
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
