
# DOC'S NFL WAR ROOM
# Kalshi public market data connection test

import json
from pathlib import Path
from datetime import datetime, timezone

import requests

API_URL = "https://external-api.kalshi.com/trade-api/v2/markets"

def main():
    print("Connecting to Kalshi...")

    response = requests.get(
        API_URL,
        params={"limit": 5, "status": "open"},
        timeout=30
    )
    response.raise_for_status()

    markets = response.json().get("markets", [])

    output = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "source": "Kalshi",
        "markets": [
            {
                "ticker": m.get("ticker"),
                "title": m.get("title"),
                "yesBid": m.get("yes_bid_dollars"),
                "yesAsk": m.get("yes_ask_dollars")
            }
            for m in markets
        ]
    }

    Path("data").mkdir(exist_ok=True)

    with open("data/kalshi-markets.json", "w") as file:
        json.dump(output, file, indent=2)

    print("KALSHI CONNECTION SUCCESSFUL")
    print(f"Retrieved {len(markets)} markets.")
    print("Saved data/kalshi-markets.json")

if __name__ == "__main__":
    main()
