// DOC'S NFL WAR ROOM
// CBS SPORTSBOOK RESEARCH DISPLAY
//
// This file controls the Sportsbook Research section.
// Verified sportsbook data will be loaded from:
// data/sportsbook-2026.json
//
// IMPORTANT:
// This file does NOT scrape CBS directly from the browser.
// Our GitHub data collector will create the JSON file.

let sportsbookData = null;


// =========================================
// TEAM CODES
// =========================================

const sportsbookTeamCodes = {
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


// =========================================
// FORMAT LINE + PRICE
// =========================================

function formatSportsbookValue(line, price) {

  if (
    line === null ||
    line === undefined ||
    line === ""
  ) {
    return "—";
  }

  let lineText = String(line);

  if (
    typeof line === "number" &&
    line > 0
  ) {
    lineText = "+" + line;
  }

  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return lineText;
  }

  let priceText = String(price);

  if (
    typeof price === "number" &&
    price > 0
  ) {
    priceText = "+" + price;
  }

  return lineText + " (" + priceText + ")";
}


// =========================================
// FORMAT PUBLIC BET
// =========================================

function formatPublicBet(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value).replace("%", "") + "%";
}


// =========================================
// CALCULATE MOVEMENT
// =========================================

function getSportsbookMovement(
  market,
  openLine,
  currentLine
) {

  const open = Number(openLine);
  const current = Number(currentLine);

  if (
    !Number.isFinite(open) ||
    !Number.isFinite(current)
  ) {
    return "—";
  }

  const difference = current - open;

  if (Math.abs(difference) < 0.001) {
    return "No move";
  }


  // TOTAL
  if (market === "Total") {

    if (difference > 0) {
      return "↑ " +
        Math.abs(difference).toFixed(1);
    }

    return "↓ " +
      Math.abs(difference).toFixed(1);
  }


  // SPREAD
  if (market === "Spread") {

    if (difference > 0) {
      return "↑ " +
        Math.abs(difference).toFixed(1);
    }

    return "↓ " +
      Math.abs(difference).toFixed(1);
  }


  // MONEYLINE
  if (market === "Moneyline") {

    if (difference > 0) {
      return "↑ " +
        Math.abs(difference).toFixed(0);
    }

    return "↓ " +
      Math.abs(difference).toFixed(0);
  }


  return "—";
}


// =========================================
// ADD TABLE ROW
// =========================================

function addSportsbookRow(
  market,
  side,
  open,
  current,
  publicBet,
  movement
) {

  const body =
    document.getElementById("oddsBody");

  if (!body) {
    return;
  }

  const row =
    document.createElement("tr");

  const values = [
    market,
    side,
    open,
    current,
    publicBet,
    movement
  ];

  values.forEach(value => {

    const cell =
      document.createElement("td");

    cell.textContent = value;

    row.appendChild(cell);

  });

  body.appendChild(row);
}


// =========================================
// RENDER SPORTSBOOK RESEARCH
// =========================================

function renderSportsbook() {

  const body =
    document.getElementById("oddsBody");

  if (!body) {
    return;
  }

  body.replaceChildren();


  const awayName =
    document.getElementById("away").value;

  const homeName =
    document.getElementById("home").value;


  if (!sportsbookData) {

    addSportsbookRow(
      "Awaiting verified CBS data",
      "—",
      "—",
      "—",
      "—",
      "—"
    );

    return;
  }


  const awayCode =
    sportsbookTeamCodes[awayName];

  const homeCode =
    sportsbookTeamCodes[homeName];


  if (!awayCode || !homeCode) {

    addSportsbookRow(
      "Team mapping unavailable",
      "—",
      "—",
      "—",
      "—",
      "—"
    );

    return;
  }


  const games =
    sportsbookData.games || [];


  const game =
    games.find(item => {

      return (
        item.away === awayCode &&
        item.home === homeCode
      );

    });


  if (!game) {

    addSportsbookRow(
      "No verified CBS record",
      awayCode + " @ " + homeCode,
      "—",
      "—",
      "—",
      "—"
    );

    return;
  }


  // =====================================
  // SPREAD
  // =====================================

  if (game.spread) {

    const awaySpread =
      game.spread.away || {};

    const homeSpread =
      game.spread.home || {};


    addSportsbookRow(
      "Spread",
      awayCode,

      formatSportsbookValue(
        awaySpread.open,
        awaySpread.openPrice
      ),

      formatSportsbookValue(
        awaySpread.current,
        awaySpread.currentPrice
      ),

      formatPublicBet(
        awaySpread.publicBet
      ),

      getSportsbookMovement(
        "Spread",
        awaySpread.open,
        awaySpread.current
      )
    );


    addSportsbookRow(
      "Spread",
      homeCode,

      formatSportsbookValue(
        homeSpread.open,
        homeSpread.openPrice
      ),

      formatSportsbookValue(
        homeSpread.current,
        homeSpread.currentPrice
      ),

      formatPublicBet(
        homeSpread.publicBet
      ),

      getSportsbookMovement(
        "Spread",
        homeSpread.open,
        homeSpread.current
      )
    );

  }


  // =====================================
  // MONEYLINE
  // =====================================

  if (game.moneyline) {

    const awayMoneyline =
      game.moneyline.away || {};

    const homeMoneyline =
      game.moneyline.home || {};


    addSportsbookRow(
      "Moneyline",
      awayCode,

      formatSportsbookValue(
        awayMoneyline.open,
        null
      ),

      formatSportsbookValue(
        awayMoneyline.current,
        null
      ),

      formatPublicBet(
        awayMoneyline.publicBet
      ),

      getSportsbookMovement(
        "Moneyline",
        awayMoneyline.open,
        awayMoneyline.current
      )
    );


    addSportsbookRow(
      "Moneyline",
      homeCode,

      formatSportsbookValue(
        homeMoneyline.open,
        null
      ),

      formatSportsbookValue(
        homeMoneyline.current,
        null
      ),

      formatPublicBet(
        homeMoneyline.publicBet
      ),

      getSportsbookMovement(
        "Moneyline",
        homeMoneyline.open,
        homeMoneyline.current
      )
    );

  }


  // =====================================
  // TOTAL
  // =====================================

  if (game.total) {

    const over =
      game.total.over || {};

    const under =
      game.total.under || {};


    addSportsbookRow(
      "Total",
      "Over",

      formatSportsbookValue(
        over.open,
        over.openPrice
      ),

      formatSportsbookValue(
        over.current,
        over.currentPrice
      ),

      formatPublicBet(
        over.publicBet
      ),

      getSportsbookMovement(
        "Total",
        over.open,
        over.current
      )
    );


    addSportsbookRow(
      "Total",
      "Under",

      formatSportsbookValue(
        under.open,
        under.openPrice
      ),

      formatSportsbookValue(
        under.current,
        under.currentPrice
      ),

      formatPublicBet(
        under.publicBet
      ),

      getSportsbookMovement(
        "Total",
        under.open,
        under.current
      )
    );

  }

}


// =========================================
// LOAD SPORTSBOOK DATA
// =========================================

async function loadSportsbook() {

  try {

    const response =
      await fetch(
        "data/sportsbook-2026.json"
      );


    if (!response.ok) {

      throw new Error(
        "HTTP " + response.status
      );

    }


    sportsbookData =
      await response.json();


    renderSportsbook();


  } catch (error) {

    sportsbookData = null;

    renderSportsbook();

  }

}


// =========================================
// UPDATE WHEN ANALYZE IS CLICKED
// =========================================

if (typeof analyze === "function") {

  const sportsbookOriginalAnalyze =
    analyze;


  analyze = function () {

    sportsbookOriginalAnalyze();

    renderSportsbook();

  };

}


// =========================================
// START
// =========================================

loadSportsbook();
