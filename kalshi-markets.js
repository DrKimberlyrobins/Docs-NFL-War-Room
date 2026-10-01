
// DOC'S NFL WAR ROOM
// KALSHI MARKET DASHBOARD
// Reads our automatically updated GitHub data.

(async function () {
  "use strict";

  const section = document.createElement("section");
  section.style.cssText = `
    background: #172337;
    color: white;
    padding: 20px;
    margin: 20px 0;
    border: 1px solid #299764;
    border-radius: 12px;
    font-family: Arial, sans-serif;
  `;

  section.innerHTML = `
    <h2 style="color:#41d98b">
      KALSHI NFL MARKET INTELLIGENCE
    </h2>
    <p id="kalshiStatus">Loading Kalshi markets...</p>
    <input
      id="kalshiSearch"
      type="search"
      placeholder="Search player, team or market"
      style="padding:12px;width:100%;box-sizing:border-box"
    >
    <div style="overflow-x:auto;margin-top:15px">
      <table style="width:100%;text-align:left">
        <thead>
          <tr>
            <th>Market</th>
            <th>YES Bid</th>
            <th>YES Ask</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody id="kalshiRows"></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(section);

  const status = document.getElementById("kalshiStatus");
  const search = document.getElementById("kalshiSearch");
  const rows = document.getElementById("kalshiRows");

  try {
    const response = await fetch(
      "data/kalshi-markets.json?refresh=" + Date.now()
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();
    const markets = data.markets || [];

    function displayMarkets() {
      const query = search.value.toLowerCase().trim();

      const filtered = markets.filter(market => {
        const searchable = [
          market.title,
          market.subtitle,
          market.ticker,
          market.series
        ].join(" ").toLowerCase();

        return searchable.includes(query);
      }).slice(0, 100);

      rows.replaceChildren();

      filtered.forEach(market => {
        const tr = document.createElement("tr");

        const values = [
          market.title || market.ticker || "Unknown",
          market.yesBid ?? "—",
          market.yesAsk ?? "—",
          market.volume ?? "—"
        ];

        values.forEach(value => {
          const td = document.createElement("td");
          td.textContent = String(value);
          td.style.cssText =
            "padding:10px;border-bottom:1px solid #35445b";
          tr.appendChild(td);
        });

        rows.appendChild(tr);
      });

      status.textContent =
        markets.length.toLocaleString() +
        " collected markets | " +
        filtered.length +
        " displayed | Updated: " +
        (data.updated || "Unknown");
    }

    search.addEventListener("input", displayMarkets);
    displayMarkets();

  } catch (error) {
    status.textContent =
      "Unable to load Kalshi data: " + error.message;
  }
})();
