
/*
 DOC'S NFL WAR ROOM
 SIDE-BY-SIDE MATCHUP BOARD
 Separate module — original calculations preserved
*/

(function () {
  "use strict";

  const ZONE = "America/Chicago";
  const API =
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

  const css = document.createElement("style");
  css.textContent = `
    #docsMatchupBoard {
      background:#13263c;
      border:1px solid #304c67;
      border-radius:12px;
      padding:20px;
      margin:20px 0;
    }
    #docsMatchupBoard h2 {
      color:#35df93;
      margin-top:0;
    }
    .docs-board-grid {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
    }
    .docs-board-game {
      background:#081525;
      border:1px solid #36516b;
      border-radius:10px;
      padding:14px;
    }
    .docs-board-time {
      color:#b5c6d6;
      font-size:13px;
      margin-bottom:12px;
    }
    .docs-board-teams {
      display:grid;
      grid-template-columns:1fr 24px 1fr;
      align-items:center;
      gap:5px;
      text-align:center;
      font-weight:bold;
    }
    .docs-board-teams span {
      overflow-wrap:anywhere;
    }
    .docs-board-versus {
      color:#35df93;
    }
    .docs-board-game button {
      margin-top:12px;
      padding:10px;
      font-size:14px;
    }
    .docs-board-game.selected {
      border:2px solid #35df93;
    }
    .docs-board-status {
      color:#b5c6d6;
      margin:10px 0;
    }
    .docs-board-refresh {
      max-width:180px;
      margin:10px 0;
    }
    @media(max-width:700px) {
      .docs-board-grid {
        grid-template-columns:1fr;
      }
    }
  `;
  document.head.appendChild(css);

  const board = document.createElement("section");
  board.id = "docsMatchupBoard";
  board.innerHTML = `
    <h2>NFL MATCHUP BOARD</h2>
    <p class="note">
      Opposing teams together • Kickoff order • Central Time
    </p>
    <button class="docs-board-refresh"
      id="docsRefreshSchedule" type="button">
      Refresh Schedule
    </button>
    <div id="docsScheduleStatus"
      class="docs-board-status">
      Loading NFL schedule...
    </div>
    <div id="docsScheduleGames"
      class="docs-board-grid"></div>
  `;

  const teamPanel = document.querySelector("#away")
    ?.closest(".panel");

  if (!teamPanel) {
    console.error("NFL Matchup Board: selectors not found.");
    return;
  }

  teamPanel.before(board);

  const status =
    document.getElementById("docsScheduleStatus");
  const grid =
    document.getElementById("docsScheduleGames");

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  function selectTeam(select, name) {
    const option = [...select.options].find(
      o => o.value.toLowerCase() ===
           name.toLowerCase()
    );

    if (!option) return false;

    select.value = option.value;
    select.dispatchEvent(new Event("change", {
      bubbles:true
    }));
    return true;
  }

  function openMatchup(away, home, card) {
    const awaySelect = document.getElementById("away");
    const homeSelect = document.getElementById("home");

    const oldAway = awaySelect.value;
    const oldHome = homeSelect.value;

    const foundAway = selectTeam(awaySelect, away);
    const foundHome = selectTeam(homeSelect, home);

    if (!foundAway || !foundHome) {
      awaySelect.value = oldAway;
      homeSelect.value = oldHome;
      status.textContent =
        "Team name mismatch. Existing selection preserved.";
      return;
    }

    document.querySelectorAll(".docs-board-game")
      .forEach(el => el.classList.remove("selected"));

    card.classList.add("selected");

    if (typeof window.analyze === "function") {
      window.analyze();
    }

    document.getElementById("matchup")
      ?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });
  }

  function addGame(event) {
    const competitors =
      event.competitions?.[0]?.competitors || [];

    const away = competitors.find(
      c => c.homeAway === "away"
    )?.team;

    const home = competitors.find(
      c => c.homeAway === "home"
    )?.team;

    if (!away || !home || !event.date) return;

    const awayName = away.displayName;
    const homeName = home.displayName;

    if (!awayName || !homeName) return;

    const card = document.createElement("article");
    card.className = "docs-board-game";

    const time = document.createElement("div");
    time.className = "docs-board-time";
    time.textContent =
      formatter.format(new Date(event.date)) + " CT";

    const teams = document.createElement("div");
    teams.className = "docs-board-teams";

    const awayLabel = document.createElement("span");
    awayLabel.textContent = awayName;

    const versus = document.createElement("span");
    versus.className = "docs-board-versus";
    versus.textContent = "@";

    const homeLabel = document.createElement("span");
    homeLabel.textContent = homeName;

    teams.append(awayLabel, versus, homeLabel);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Analyze Matchup";
    button.addEventListener("click", () => {
      openMatchup(awayName, homeName, card);
    });

    card.append(time, teams, button);
    grid.appendChild(card);
  }

  async function loadSchedule() {
    status.textContent = "Loading NFL games...";
    grid.replaceChildren();

    try {
      const response = await fetch(API, {
        cache:"no-store"
      });

      if (!response.ok) {
        throw new Error("Schedule request failed");
      }

      const data = await response.json();
      const games = (data.events || [])
        .filter(e => e.date && e.competitions?.length)
        .sort((a,b) =>
          new Date(a.date) - new Date(b.date)
        );

      if (!games.length) {
        status.textContent =
          "No games returned for the current NFL week.";
        return;
      }

      games.forEach(addGame);

      status.textContent =
        `${grid.children.length} matchups loaded ` +
        "in kickoff order.";

    } catch (error) {
      status.textContent =
        "Schedule unavailable. Use the original " +
        "Away/Home selectors below.";
      console.error("NFL schedule error:", error);
    }
  }

  document.getElementById("docsRefreshSchedule")
    .addEventListener("click", loadSchedule);

  loadSchedule();
})();
