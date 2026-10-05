/* =========================================================
   DOC'S NFL WAR ROOM
   POSTGAME EVALUATION ENGINE
   Phase 2: Receipt Grader Test
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     VERIFIED COMPLETED GAME
     Detroit Lions @ Carolina Panthers — Oct. 4, 2026
     --------------------------------------------------------- */

  const completedGame = {
    away: "Detroit Lions",
    home: "Carolina Panthers",

    awayScore: {
      q1: 3,
      q2: 13,
      q3: 3,
      q4: 7,
      final: 26
    },

    homeScore: {
      q1: 7,
      q2: 9,
      q3: 13,
      q4: 3,
      final: 32
    }
  };


  /* ---------------------------------------------------------
     ORIGINAL SAVED PREGAME RECEIPT
     These are the lines we saved BEFORE the game.
     --------------------------------------------------------- */

  const savedReceipt = [

    {
      player: "Bryce Young",
      market: "300+ Passing Yards",
      projection: 313.0,
      line: 300,
      price: "+350",
      stat: "passingYards"
    },

    {
      player: "Amon-Ra St. Brown",
      market: "80+ Receiving Yards",
      projection: 76.0,
      line: 80,
      price: "-106",
      stat: "receivingYards"
    },

    {
      player: "Amon-Ra St. Brown",
      market: "TD in 2nd Half",
      projection: "Scoring profile",
      line: "Yes",
      price: "+205",
      stat: "secondHalfTD"
    },

    {
      player: "Jahmyr Gibbs",
      market: "100+ Rushing Yards",
      projection: 102.3,
      line: 100,
      price: "+102",
      stat: "rushingYards"
    },

    {
      player: "Jahmyr Gibbs",
      market: "TD in 2nd Half",
      projection: "Scoring profile",
      line: "Yes",
      price: "-115",
      stat: "secondHalfTD"
    }

  ];


  /* ---------------------------------------------------------
     VERIFIED ACTUAL PLAYER RESULTS

     IMPORTANT:
     TD timing is intentionally left unresolved until
     scoring-play timing is verified separately.
     --------------------------------------------------------- */

  const actualPlayerResults = {

    "Bryce Young": {
      passingYards: 329
    },

    "Amon-Ra St. Brown": {
      receivingYards: 75,
      secondHalfTD: null
    },

    "Jahmyr Gibbs": {
      rushingYards: 46,
      secondHalfTD: null
    }

  };


  /* ---------------------------------------------------------
     FIRST HALF
     --------------------------------------------------------- */

  function firstHalf(score) {
    return score.q1 + score.q2;
  }


  /* ---------------------------------------------------------
     GAME SCORE ROW
     --------------------------------------------------------- */

  function createScoreRow(team, score) {

    const row = document.createElement("tr");

    const values = [
      team,
      score.q1,
      score.q2,
      firstHalf(score),
      score.q3,
      score.q4,
      score.final
    ];

    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    return row;
  }


  /* ---------------------------------------------------------
     LOAD GAME RESULT
     --------------------------------------------------------- */

  function loadGameResult() {

    const body =
      document.getElementById("postgameScoreBody");

    const status =
      document.getElementById("postgameStatus");

    if (!body || !status) return;

    body.replaceChildren();

    body.appendChild(
      createScoreRow(
        completedGame.away,
        completedGame.awayScore
      )
    );

    body.appendChild(
      createScoreRow(
        completedGame.home,
        completedGame.homeScore
      )
    );

    status.textContent =
      "VERIFIED FINAL — Detroit Lions 26 at Carolina Panthers 32";
  }


  /* ---------------------------------------------------------
     GRADE ONE RECEIPT
     --------------------------------------------------------- */

  function gradeReceipt(receipt) {

    const playerResult =
      actualPlayerResults[receipt.player];

    if (!playerResult) {
      return {
        actual: "Not found",
        grade: "REVIEW"
      };
    }

    const actual =
      playerResult[receipt.stat];

    /*
       null means we do NOT yet have enough verified
       information to settle that exact market.
    */

    if (actual === null || actual === undefined) {
      return {
        actual: "Awaiting verification",
        grade: "REVIEW"
      };
    }

    /*
       Numeric PLUS markets:
       300+ passing, 80+ receiving, 100+ rushing, etc.
    */

    if (typeof receipt.line === "number") {

      if (actual >= receipt.line) {
        return {
          actual: actual,
          grade: "WIN"
        };
      }

      return {
        actual: actual,
        grade: "LOSS"
      };
    }

    return {
      actual: String(actual),
      grade: "REVIEW"
    };
  }


  /* ---------------------------------------------------------
     RECEIPT ROW
     --------------------------------------------------------- */

  function createReceiptRow(receipt) {

    const evaluation =
      gradeReceipt(receipt);

    const row =
      document.createElement("tr");

    const playerMarket =
      receipt.player + " — " + receipt.market;

    const values = [
      playerMarket,
      receipt.projection,
      receipt.line,
      receipt.price,
      evaluation.actual,
      evaluation.grade
    ];

    values.forEach((value, index) => {

      const cell =
        document.createElement("td");

      cell.textContent = value;

      /*
        ONLY confirmed wins receive green.
        Losses and REVIEW stay neutral.
      */

      if (
        index === 5 &&
        evaluation.grade === "WIN"
      ) {
        cell.style.background =
          "rgba(53, 223, 147, 0.22)";

        cell.style.color =
          "#7cf5ba";

        cell.style.fontWeight =
          "900";
      }

      row.appendChild(cell);

    });

    return row;
  }


  /* ---------------------------------------------------------
     LOAD RECEIPT
     --------------------------------------------------------- */

  function loadReceiptEvaluation() {

    const body =
      document.getElementById(
        "postgameReceiptBody"
      );

    if (!body) return;

    body.replaceChildren();

    savedReceipt.forEach(receipt => {

      body.appendChild(
        createReceiptRow(receipt)
      );

    });

  }


  /* ---------------------------------------------------------
     SUMMARY
     REVIEW items do NOT count as wins or losses.
     --------------------------------------------------------- */

  function loadSummary() {

    const body =
      document.getElementById(
        "postgameSummaryBody"
      );

    if (!body) return;

    let wins = 0;
    let losses = 0;
    let pushes = 0;

    savedReceipt.forEach(receipt => {

      const result =
        gradeReceipt(receipt).grade;

      if (result === "WIN") wins++;
      if (result === "LOSS") losses++;
      if (result === "PUSH") pushes++;

    });

    const graded =
      wins + losses;

    const winRate =
      graded > 0
        ? ((wins / graded) * 100).toFixed(1) + "%"
        : "—";

    body.innerHTML = `
      <tr>
        <td>Game Markets</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
      </tr>

      <tr>
        <td>Player Props</td>
        <td>${wins}</td>
        <td>${losses}</td>
        <td>${pushes}</td>
        <td>${winRate}</td>
      </tr>

      <tr>
        <td>Overall</td>
        <td>${wins}</td>
        <td>${losses}</td>
        <td>${pushes}</td>
        <td>${winRate}</td>
      </tr>
    `;
  }


  /* ---------------------------------------------------------
     START POSTGAME ENGINE
     --------------------------------------------------------- */

  function startPostgame() {
    loadGameResult();
    loadReceiptEvaluation();
    loadSummary();
  }

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      startPostgame
    );

  } else {

    startPostgame();

  }

})();
