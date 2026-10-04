/* =========================================================
   DOC'S NFL WAR ROOM
   AUTOMATIC OFFICIAL RECEIPT
   ========================================================= */

(() => {
  "use strict";

  const RECORDS_URL =
    "https://script.google.com/macros/s/AKfycbxovg8I9EhY3QNZ5Bl81jJDJiQ_Ddr4NwNIyO3lXiNmr0qq5w06hj7dA1DBjuuDUfHI/exec";

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
    "Los Angeles Rams": "LAR",
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


  const EDGE_RULES = {
    "1Q": 1.0,
    "1H": 2.0,
    "Full Game": 3.0
  };


  function clean(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }


  function numberFrom(value) {
    const match =
      clean(value).match(/-?\d+(?:\.\d+)?/);

    return match
      ? Number(match[0])
      : null;
  }


  function getMatchup() {
    const away =
      document.getElementById("away")?.value || "";

    const home =
      document.getElementById("home")?.value || "";

    return {
      away,
      home,
      awayCode: teamCodes[away] || away,
      homeCode: teamCodes[home] || home
    };
  }


  function getTableRows(bodyId) {
    const body =
      document.getElementById(bodyId);

    if (!body) {
      return [];
    }

    return Array.from(
      body.querySelectorAll("tr")
    )
      .map(row =>
        Array.from(
          row.querySelectorAll("td")
        ).map(cell => ({
          text: clean(cell.textContent),
          green:
            cell.classList.contains(
              "epa-winner"
            ) ||
            cell.classList.contains(
              "score-winner"
            ) ||
            cell.classList.contains(
              "scoring-winner"
            ) ||
            cell.classList.contains(
              "winner"
            )
        }))
      )
      .filter(row => row.length > 1);
  }


  function findRow(rows, words) {
    return rows.find(row => {
      const label =
        row[0]?.text.toLowerCase() || "";

      return words.every(word =>
        label.includes(
          word.toLowerCase()
        )
      );
    });
  }


  function findAnyRow(rows, groups) {
    for (const words of groups) {
      const row = findRow(rows, words);

      if (row) {
        return row;
      }
    }

    return null;
  }


  function getScoringSnapshot() {
    const rows =
      getTableRows("scoringBody");

    const oneQ =
      findAnyRow(rows, [
        ["1q"],
        ["1st", "quarter"],
        ["first", "quarter"]
      ]);

    const oneH =
      findAnyRow(rows, [
        ["1h"],
        ["1st", "half"],
        ["first", "half"]
      ]);

    const full =
      findAnyRow(rows, [
        ["full"],
        ["game"]
      ]);


    function parsePeriod(row, period) {
      if (
        !row ||
        row.length < 3
      ) {
        return null;
      }

      const away =
        numberFrom(row[1].text);

      const home =
        numberFrom(row[2].text);

      if (
        !Number.isFinite(away) ||
        !Number.isFinite(home)
      ) {
        return null;
      }

      const margin =
        Math.abs(away - home);

      return {
        period,
        away,
        home,
        total: away + home,
        margin,
        winner:
          away > home
            ? "away"
            : home > away
              ? "home"
              : "tie",
        threshold:
          EDGE_RULES[period] ?? 0
      };
    }


    return {
      oneQ:
        parsePeriod(oneQ, "1Q"),

      oneH:
        parsePeriod(oneH, "1H"),

      full:
        parsePeriod(
          full,
          "Full Game"
        )
    };
  }


  function getSportsbookRows() {
    return getTableRows("oddsBody")
      .map(row => ({
        market: row[0]?.text || "",
        side: row[1]?.text || "",
        open: row[2]?.text || "",
        current: row[3]?.text || "",
        publicBet: row[4]?.text || "",
        movement: row[5]?.text || ""
      }))
      .filter(row =>
        row.market &&
        !row.market
          .toLowerCase()
          .includes("awaiting")
      );
  }


  function findSportsbookRow(
    sportsbookRows,
    marketWords,
    sideWords = []
  ) {

    return sportsbookRows.find(row => {

      const market =
        row.market.toLowerCase();

      const side =
        row.side.toLowerCase();

      const marketMatches =
        marketWords.every(word =>
          market.includes(
            word.toLowerCase()
          )
        );

      const sideMatches =
        sideWords.length === 0 ||
        sideWords.every(word =>
          side.includes(
            word.toLowerCase()
          )
        );

      return (
        marketMatches &&
        sideMatches
      );
    });
  }


  function extractLineAndPrice(value) {
    const text = clean(value);

    if (!text) {
      return {
        line: "",
        price: ""
      };
    }

    const priceMatch =
      text.match(
        /\(([+-]\d+)\)/
      );

    const withoutPrice =
      text
        .replace(
          /\(([+-]\d+)\)/,
          ""
        )
        .trim();

    return {
      line: withoutPrice,
      price:
        priceMatch
          ? priceMatch[1]
          : ""
    };
  }


  function teamMatchesSide(
    sportsbookSide,
    team,
    code
  ) {
    const side =
      sportsbookSide
        .toLowerCase();

    return (
      side.includes(
        team.toLowerCase()
      ) ||
      side.includes(
        code.toLowerCase()
      )
    );
  }


  function findTeamSpread(
    sportsbookRows,
    team,
    code
  ) {
    return sportsbookRows.find(row => {

      const market =
        row.market.toLowerCase();

      return (
        market.includes("spread") &&
        teamMatchesSide(
          row.side,
          team,
          code
        )
      );
    });
  }


  function findTeamMoneyline(
    sportsbookRows,
    team,
    code
  ) {
    return sportsbookRows.find(row => {

      const market =
        row.market.toLowerCase();

      return (
        (
          market.includes(
            "moneyline"
          ) ||
          market.includes(
            "money line"
          ) ||
          market === "ml"
        ) &&
        teamMatchesSide(
          row.side,
          team,
          code
        )
      );
    });
  }


  function findTotal(
    sportsbookRows,
    direction
  ) {
    return sportsbookRows.find(row => {

      const market =
        row.market.toLowerCase();

      const side =
        row.side.toLowerCase();

      return (
        market.includes("total") &&
        side.includes(
          direction.toLowerCase()
        )
      );
    });
  }


  function candidateCard(candidate) {
    const card =
      document.createElement("div");

    card.style.cssText = `
      border:1px solid #304c67;
      border-radius:10px;
      padding:16px;
      margin:14px 0;
      background:#0d1d30;
    `;


    const qualifiesText =
      candidate.qualifies
        ? "QUALIFIES FOR REVIEW"
        : "PASS — EDGE BELOW THRESHOLD";


    const qualifiesColor =
      candidate.qualifies
        ? "#35df93"
        : "#f0b35a";


    card.innerHTML = `
      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        ${candidate.market}
      </div>

      <div
        style="
          color:${qualifiesColor};
          font-weight:900;
          margin-bottom:10px;
        "
      >
        ${qualifiesText}
      </div>

      <div style="line-height:1.7;">
        <strong>War Room:</strong>
        ${candidate.projection}
        <br>

        <strong>Model Edge:</strong>
        ${candidate.edge}
        <br>

        <strong>Current Sportsbook:</strong>
        ${candidate.sportsbookDisplay || "Not available"}
        <br>

        <strong>Movement:</strong>
        ${candidate.movement || "—"}
        <br>

        <strong>Reason:</strong>
        ${candidate.reason}
      </div>
    `;


    if (candidate.qualifies) {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.textContent =
        "SAVE TO OFFICIAL RECEIPT";

      button.style.marginTop =
        "14px";


      button.addEventListener(
        "click",
        async () => {

          await saveCandidate(
            candidate,
            button
          );
        }
      );


      card.appendChild(button);
    }


    return card;
  }


  function buildSideCandidate(
    period,
    scoring,
    matchup,
    sportsbookRows
  ) {

    if (
      !scoring ||
      scoring.winner === "tie"
    ) {
      return null;
    }


    const winningTeam =
      scoring.winner === "away"
        ? matchup.away
        : matchup.home;


    const winningCode =
      scoring.winner === "away"
        ? matchup.awayCode
        : matchup.homeCode;


    const spreadRow =
      findTeamSpread(
        sportsbookRows,
        winningTeam,
        winningCode
      );


    const current =
      spreadRow
        ? extractLineAndPrice(
            spreadRow.current
          )
        : {
            line: "",
            price: ""
          };


    const projection =
      `${winningCode} by ` +
      `${scoring.margin.toFixed(1)}`;


    const qualifies =
      scoring.margin >=
      scoring.threshold;


    const selection =
      current.line
        ? `${winningCode} ${current.line}`
        : winningCode;


    return {
      market:
        `${period} Side`,

      selection,

      sportsbookLine:
        current.line,

      price:
        current.price,

      sportsbookDisplay:
        spreadRow
          ? `${spreadRow.current}`
          : "",

      movement:
        spreadRow
          ? spreadRow.movement
          : "",

      projection,

      edge:
        scoring.margin.toFixed(1),

      qualifies,

      reason:
        qualifies
          ? `${winningCode} model scoring advantage ` +
            `meets the ${scoring.threshold.toFixed(1)}-point ` +
            `${period} War Room threshold.`
          : `${winningCode} model scoring advantage is only ` +
            `${scoring.margin.toFixed(1)}, below the ` +
            `${scoring.threshold.toFixed(1)}-point ` +
            `${period} threshold.`
    };
  }


  function buildFullGameTotalCandidate(
    scoring,
    sportsbookRows
  ) {

    if (!scoring) {
      return null;
    }


    const overRow =
      findTotal(
        sportsbookRows,
        "over"
      );

    const underRow =
      findTotal(
        sportsbookRows,
        "under"
      );


    const referenceRow =
      overRow || underRow;


    if (!referenceRow) {
      return {
        market:
          "Full Game Total",

        selection:
          "NO VERIFIED LINE",

        sportsbookLine: "",
        price: "",

        sportsbookDisplay:
          "No verified total",

        movement: "",

        projection:
          scoring.total.toFixed(1),

        edge: "",

        qualifies: false,

        reason:
          "War Room total projection exists, but no verified sportsbook total is available."
      };
    }


    const current =
      extractLineAndPrice(
        referenceRow.current
      );


    const bookTotal =
      numberFrom(
        current.line
      );


    if (
      !Number.isFinite(bookTotal)
    ) {
      return {
        market:
          "Full Game Total",

        selection:
          "PASS",

        sportsbookLine:
          current.line,

        price:
          current.price,

        sportsbookDisplay:
          referenceRow.current,

        movement:
          referenceRow.movement,

        projection:
          scoring.total.toFixed(1),

        edge: "",

        qualifies: false,

        reason:
          "Sportsbook total could not be read safely."
      };
    }


    const difference =
      scoring.total - bookTotal;


    const direction =
      difference > 0
        ? "OVER"
        : difference < 0
          ? "UNDER"
          : "PASS";


    const chosenRow =
      direction === "OVER"
        ? overRow
        : direction === "UNDER"
          ? underRow
          : referenceRow;


    const chosen =
      chosenRow
        ? extractLineAndPrice(
            chosenRow.current
          )
        : current;


    /*
      We display the total comparison,
      but do NOT automatically qualify it.

      The existing War Room green rules
      were built for scoring-side margins,
      not for declaring a total bet.
    */

    return {
      market:
        "Full Game Total",

      selection:
        direction === "PASS"
          ? "PASS"
          : `${direction} ${chosen.line}`,

      sportsbookLine:
        chosen.line,

      price:
        chosen.price,

      sportsbookDisplay:
        chosenRow
          ? chosenRow.current
          : referenceRow.current,

      movement:
        chosenRow
          ? chosenRow.movement
          : referenceRow.movement,

      projection:
        scoring.total.toFixed(1),

      edge:
        Math.abs(
          difference
        ).toFixed(1),

      qualifies: false,

      reason:
        `War Room projects ${scoring.total.toFixed(1)} ` +
        `against sportsbook ${bookTotal.toFixed(1)}. ` +
        `Total is displayed for research but is not ` +
        `auto-qualified by the side-edge thresholds.`
    };
  }


  function buildCandidates() {

    const matchup =
      getMatchup();

    const scoring =
      getScoringSnapshot();

    const sportsbookRows =
      getSportsbookRows();


    const candidates = [];


    const oneQ =
      buildSideCandidate(
        "1Q",
        scoring.oneQ,
        matchup,
        sportsbookRows
      );


    const oneH =
      buildSideCandidate(
        "1H",
        scoring.oneH,
        matchup,
        sportsbookRows
      );


    const full =
      buildSideCandidate(
        "Full Game",
        scoring.full,
        matchup,
        sportsbookRows
      );


    const total =
      buildFullGameTotalCandidate(
        scoring.full,
        sportsbookRows
      );


    if (oneQ) {
      candidates.push(oneQ);
    }

    if (oneH) {
      candidates.push(oneH);
    }

    if (full) {
      candidates.push(full);
    }

    if (total) {
      candidates.push(total);
    }


    return candidates;
  }


  function renderReceipt() {

    const list =
      document.getElementById(
        "receiptCandidates"
      );

    const status =
      document.getElementById(
        "receiptStatus"
      );


    if (
      !list ||
      !status
    ) {
      return;
    }


    list.replaceChildren();


    const matchup =
      getMatchup();


    if (
      !matchup.away ||
      !matchup.home ||
      matchup.away === matchup.home
    ) {
      status.textContent =
        "Analyze two different teams first.";

      return;
    }


    const candidates =
      buildCandidates();


    if (!candidates.length) {
      status.textContent =
        "Waiting for War Room scoring data.";

      return;
    }


    candidates.forEach(candidate => {
      list.appendChild(
        candidateCard(candidate)
      );
    });


    const qualifying =
      candidates.filter(
        candidate =>
          candidate.qualifies
      ).length;


    status.textContent =
      qualifying > 0
        ? `${qualifying} War Room candidate` +
          `${qualifying === 1 ? "" : "s"} ` +
          `qualify for review.`
        : "No side currently meets the War Room threshold. PASS is valid.";
  }


  async function saveCandidate(
    candidate,
    button
  ) {

    const matchup =
      getMatchup();

    const status =
      document.getElementById(
        "receiptStatus"
      );


    try {

      if (!candidate.qualifies) {
        throw new Error(
          "This candidate does not qualify."
        );
      }


      const record = {

        type: "receipt",

        timestamp: "",

        matchup:
          `${matchup.awayCode} — ${matchup.away} @ ` +
          `${matchup.homeCode} — ${matchup.home}`,

        market:
          candidate.market,

        selection:
          candidate.selection,

        sportsbookLine:
          candidate.sportsbookLine,

        price:
          candidate.price,

        warRoomProjection:
          candidate.projection,

        calculatedEdge:
          candidate.edge,

        status:
          "OFFICIAL",

        reason:
          candidate.reason,

        actualResult: "",

        finalOutcome: "",

        postgameNotes: ""
      };


      button.disabled = true;

      button.textContent =
        "SAVING...";


      const response =
        await fetch(
          RECORDS_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },

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
          "Receipt save was not confirmed."
        );
      }


      button.textContent =
        "SAVED TO RECEIPT";

      status.textContent =
        `OFFICIAL RECEIPT SAVED — ` +
        `${candidate.selection}`;


    } catch (error) {

      console.error(
        "Receipt save error:",
        error
      );


      button.disabled = false;

      button.textContent =
        "SAVE TO OFFICIAL RECEIPT";


      status.textContent =
        "SAVE FAILED: " +
        error.message;
    }
  }


  function createReceiptPanel() {

    if (
      document.getElementById(
        "receiptPanel"
      )
    ) {
      return;
    }


    const playerPanel =
      document.getElementById(
        "playerRecordsPanel"
      );


    if (!playerPanel) {

      setTimeout(
        createReceiptPanel,
        250
      );

      return;
    }


    const panel =
      document.createElement("div");

    panel.className =
      "panel";

    panel.id =
      "receiptPanel";


    panel.innerHTML = `
      <h2>
        Official War Room Receipt
      </h2>

      <p class="note">
        Built automatically from the current
        War Room scoring and sportsbook data.
        Green means review — not an automatic bet.
        No edge = no bet. Conflicts = PASS.
      </p>

      <button
        id="refreshReceipt"
        type="button"
      >
        BUILD RECEIPT FROM WAR ROOM
      </button>

      <p
        id="receiptStatus"
        class="status"
      >
        Waiting for War Room analysis.
      </p>

      <div
        id="receiptCandidates"
      ></div>
    `;


    playerPanel.insertAdjacentElement(
      "afterend",
      panel
    );


    document
      .getElementById(
        "refreshReceipt"
      )
      .addEventListener(
        "click",
        renderReceipt
      );
  }


  function watchWarRoom() {

    const targets = [
      document.getElementById(
        "scoringBody"
      ),
      document.getElementById(
        "oddsBody"
      )
    ].filter(Boolean);


    if (!targets.length) {
      return;
    }


    let timer = null;


    const observer =
      new MutationObserver(() => {

        clearTimeout(timer);

        timer =
          setTimeout(() => {

            if (
              document.getElementById(
                "receiptPanel"
              )
            ) {
              renderReceipt();
            }

          }, 400);
      });


    targets.forEach(target => {

      observer.observe(
        target,
        {
          childList: true,
          subtree: true,
          characterData: true
        }
      );

    });
  }


  function start() {

    createReceiptPanel();

    watchWarRoom();


    /*
      Give the other War Room scripts time
      to populate their tables, then build
      the first receipt view.
    */

    setTimeout(
      renderReceipt,
      1200
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }

})();
