
// DOC'S NFL WAR ROOM
// KALSHI PUBLIC MARKET DATA
// Connection test — no trading credentials

const KALSHI_API =
  "https://api.elections.kalshi.com/trade-api/v2";

async function testKalshiConnection() {
  console.log("Connecting to Kalshi...");

  try {
    const response = await fetch(
      KALSHI_API + "/markets?limit=5&status=open"
    );

    if (!response.ok) {
      throw new Error(
        "Kalshi returned HTTP " + response.status
      );
    }

    const data = await response.json();

    console.log("KALSHI CONNECTION SUCCESSFUL");
    console.log(
      "Markets received:",
      data.markets?.length ?? 0
    );

    console.table(
      (data.markets || []).map(market => ({
        ticker: market.ticker,
        title: market.title,
        yesBid: market.yes_bid_dollars,
        yesAsk: market.yes_ask_dollars
      }))
    );

  } catch (error) {
    console.error(
      "KALSHI CONNECTION FAILED:",
      error.message
    );
  }
}

testKalshiConnection();
