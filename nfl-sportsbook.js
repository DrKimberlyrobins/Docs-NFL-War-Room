// DOC'S NFL WAR ROOM
// CBS SPORTSBOOK RESEARCH DISPLAY
//
// Loads verified CBS sportsbook data from:
// data/sportsbook-2026.json
//
// IMPORTANT:
// Movement is interpreted as FOOTBALL MARKET MOVEMENT,
// not simply positive/negative mathematical movement.

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
// SPREAD MOVEMENT
//
// IMPORTANT:
// Spread movement should tell us which TEAM
// the market moved toward.
//
// Example:
//
// DAL +2.5 -> +3
// HOU -2.5 -> -3
//
// The market moved 0.5 TOWARD HOU.
// =========================================

function getSpreadMovement(
  side,
  opponent,
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

  const amount =
    Math.abs(difference).toFixed(1);


  // If this team's spread becomes MORE negative,
  // market moved toward this team.
  //
  // Example:
  // HOU -2.5 -> -3

  if (current < open) {
    return "↑ " + amount + " toward " + side;
  }


  // If this team's spread becomes MORE positive,
  // market moved toward the opponent.
  //
  // Example:
  // DAL +2.5 -> +3

  if (current > open) {
    return "↑ " + amount + " toward " + opponent;
  }


  return "No move";
}


// =========================================
// TOTAL MOVEMENT
// =========================================

function getTotalMovement(
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

  const amount =
    Math.abs(difference).toFixed(1);

  if (current > open) {
    return "↑ " + amount;
  }

  return "↓ " + amount;
}


// =========================================
// MONEYLINE MOVEMENT
//
// Rather than showing a confusing raw arrow,
// describe whether the price became stronger
// or weaker for that team.
// =========================================

function getMoneylineMovement(
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

  if (open === current) {
    return "No move";
  }


  // Both negative:
  // -143 -> -155 = stronger favorite

  if (open < 0 && current < 0) {

    if (current < open) {
      return "Stronger";
    }

    return "Weaker";
  }


  // Both positive:
  // +120 -> +130 = weaker market position

  if (open > 0 && current > 0) {

    if (current < open) {
      return "Stronger";
    }

    return "Weaker";
  }


  // Crossing from underdog to favorite

  if (open > 0 && current < 0) {
    return "Stronger";
  }


  // Crossing from favorite to underdog

  if (open < 0 && current > 0) {
    return "Weaker";
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

      getSpreadMovement(
        awayCode,
        homeCode,
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

      getSpreadMovement(
        homeCode,
        awayCode,
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

      getMoneylineMovement(
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

      getMoneylineMovement(
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

      getTotalMovement(
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

      getTotalMovement(
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
