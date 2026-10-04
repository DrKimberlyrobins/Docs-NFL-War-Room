/* =========================================================
   DOC'S NFL WAR ROOM
   OFFICIAL RECEIPT
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


  function clean(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
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


  async function saveReceipt() {

    const matchup = getMatchup();

    const status =
      document.getElementById("receiptStatus");

    const button =
      document.getElementById("saveReceipt");


    try {

      if (
        !matchup.away ||
        !matchup.home ||
        matchup.away === matchup.home
      ) {
        throw new Error(
          "Analyze two different teams first."
        );
      }


      const category =
        clean(
          document.getElementById(
            "receiptCategory"
          ).value
        );

      const selection =
        clean(
          document.getElementById(
            "receiptSelection"
          ).value
        );

      const line =
        clean(
          document.getElementById(
            "receiptLine"
          ).value
        );

      const price =
        clean(
          document.getElementById(
            "receiptPrice"
          ).value
        );

      const projection =
        clean(
          document.getElementById(
            "receiptProjection"
          ).value
        );

      const edge =
        clean(
          document.getElementById(
            "receiptEdge"
          ).value
        );

      const reason =
        clean(
          document.getElementById(
            "receiptReason"
          ).value
        );


      if (!category) {
        throw new Error(
          "Choose a market."
        );
      }


      if (!selection) {
        throw new Error(
          "Enter the official selection."
        );
      }


      if (!line) {
        throw new Error(
          "Enter the target or sportsbook line."
        );
      }


      const record = {

        type: "receipt",
        timestamp: "",

        matchup:
          `${matchup.awayCode} — ${matchup.away} @ ` +
          `${matchup.homeCode} — ${matchup.home}`,

        market: category,

        selection: selection,

        sportsbookLine: line,

        price: price,

        warRoomProjection: projection,

        calculatedEdge: edge,

        status: "OFFICIAL",

        reason: reason,

        actualResult: "",

        finalOutcome: "",

        postgameNotes: ""
      };


      button.disabled = true;

      button.textContent =
        "SAVING OFFICIAL PICK...";

      status.textContent =
        "Saving to the official Receipt...";


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
        result.status !== "success"
      ) {
        throw new Error(
          result.message ||
          "Receipt save was not confirmed."
        );
      }


      status.textContent =
        `SAVED TO RECEIPT — ${selection}`;


      button.textContent =
        "OFFICIAL PICK SAVED";


      /*
        Clear entry boxes after successful save
        so we do not accidentally save the
        same selection twice.
      */

      document.getElementById(
        "receiptSelection"
      ).value = "";

      document.getElementById(
        "receiptLine"
      ).value = "";

      document.getElementById(
        "receiptPrice"
      ).value = "";

      document.getElementById(
        "receiptProjection"
      ).value = "";

      document.getElementById(
        "receiptEdge"
      ).value = "";

      document.getElementById(
        "receiptReason"
      ).value = "";


    } catch (error) {

      console.error(
        "Receipt save error:",
        error
      );

      status.textContent =
        "SAVE FAILED: " +
        error.message;

      button.textContent =
        "SAVE OFFICIAL PICK";

    } finally {

      button.disabled = false;

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

    panel.className = "panel";

    panel.id = "receiptPanel";


    panel.innerHTML = `
      <h2>Official War Room Receipt</h2>

      <p class="note">
        Only save selections that officially
        qualify. No edge = no bet.
        PASS selections do not belong on
        the Receipt.
      </p>

      <div class="grid">

        <div>
          <label>Market</label>

          <select id="receiptCategory">
            <option value="">
              Select Market
            </option>

            <option value="1Q Spread">
              1Q Spread
            </option>

            <option value="1Q Total">
              1Q Total
            </option>

            <option value="1H Spread">
              1H Spread
            </option>

            <option value="1H Total">
              1H Total
            </option>

            <option value="Full Game Spread">
              Full Game Spread
            </option>

            <option value="Full Game Total">
              Full Game Total
            </option>

            <option value="Moneyline">
              Moneyline
            </option>

            <option value="Passing Prop">
              Passing Prop
            </option>

            <option value="Rushing Prop">
              Rushing Prop
            </option>

            <option value="Receiving Prop">
              Receiving Prop
            </option>

            <option value="Touchdown Prop">
              Touchdown Prop
            </option>
          </select>
        </div>


        <div>
          <label>
            Official Selection
          </label>

          <input
            id="receiptSelection"
            type="text"
            placeholder="Example: WAS +4.5"
          >
        </div>


        <div>
          <label>
            Target / Sportsbook Line
          </label>

          <input
            id="receiptLine"
            type="text"
            placeholder="Example: +4.5"
          >
        </div>


        <div>
          <label>Price</label>

          <input
            id="receiptPrice"
            type="text"
            placeholder="Example: -110"
          >
        </div>


        <div>
          <label>
            War Room Projection
          </label>

          <input
            id="receiptProjection"
            type="text"
            placeholder="Example: WAS by 3.2"
          >
        </div>


        <div>
          <label>
            Calculated Edge
          </label>

          <input
            id="receiptEdge"
            type="text"
            placeholder="Example: +2.1"
          >
        </div>

      </div>


      <div style="margin-top:14px;">

        <label>
          Why It Qualified
        </label>

        <textarea
          id="receiptReason"
          rows="3"
          placeholder="Short War Room reason..."
          style="
            width:100%;
            box-sizing:border-box;
          "
        ></textarea>

      </div>


      <button
        id="saveReceipt"
        type="button"
        style="margin-top:14px;"
      >
        SAVE OFFICIAL PICK
      </button>


      <p
        id="receiptStatus"
        class="status"
      >
        No official selection saved yet.
      </p>
    `;


    /*
      Put Receipt immediately after
      Player Records Snapshot.
    */

    playerPanel.insertAdjacentElement(
      "afterend",
      panel
    );


    document
      .getElementById(
        "saveReceipt"
      )
      .addEventListener(
        "click",
        saveReceipt
      );
  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      createReceiptPanel
    );

  } else {

    createReceiptPanel();

  }

})();
