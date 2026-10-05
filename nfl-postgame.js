/* =========================================================
   DOC'S NFL WAR ROOM
   POSTGAME EVALUATION ENGINE
   Phase 1: Verified Game Results Test
   ========================================================= */

(() => {
  "use strict";

  /*
    TEST GAME:
    Detroit Lions @ Carolina Panthers
    October 4, 2026

    We are deliberately starting with ONE completed game.
    Once the display works correctly, this will be replaced
    by the automatic results feed.
  */

  const postgameTest = {
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


  /* =========================================================
     CALCULATE FIRST-HALF SCORE
     ========================================================= */

  function firstHalf(teamScore) {
    return teamScore.q1 + teamScore.q2;
  }


  /* =========================================================
     CREATE SCORE ROW
     ========================================================= */

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


  /* =========================================================
     DISPLAY VERIFIED GAME RESULT
     ========================================================= */

  function loadPostgameTest() {

    const body =
      document.getElementById("postgameScoreBody");

    const status =
      document.getElementById("postgameStatus");

    if (!body || !status) {
      return;
    }

    body.replaceChildren();

    body.appendChild(
      createScoreRow(
        postgameTest.away,
        postgameTest.awayScore
      )
    );

    body.appendChild(
      createScoreRow(
        postgameTest.home,
        postgameTest.homeScore
      )
    );

    status.textContent =
      "VERIFIED FINAL — Detroit Lions 26 at Carolina Panthers 32";

  }


  /* =========================================================
     START POSTGAME ENGINE
     ========================================================= */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      loadPostgameTest
    );

  } else {

    loadPostgameTest();

  }

})();
