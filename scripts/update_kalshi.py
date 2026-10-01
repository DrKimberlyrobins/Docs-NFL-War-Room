
# DOC'S NFL WAR ROOM
# Automatic Kalshi NFL market discovery

import json
import re
import time
from pathlib import Path
from datetime import datetime, timezone

import requests

BASE = "https://external-api.kalshi.com/trade-api/v2"
session = requests.Session()
session.headers.update({"User-Agent": "DocsNFLWarRoom/1.0"})

def get_data(endpoint, params=None):
    for attempt in range(3):
        try:
            response = session.get(
                BASE + endpoint,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

def get_all_series():
    series = []
    cursor = None

    while True:
        params = {"category": "Sports"}
        if cursor:
            params["cursor"] = cursor

        data = get_data("/series", params)
        series.extend(data.get("series", []))
        cursor = data.get("cursor")

        if not cursor:
            break

    return series

def is_nfl_series(series):
    ticker = series.get("ticker", "").upper()
    title = series.get("title", "").lower()

    # Exclude season-long and award markets.
    if "SEASON" in ticker or "AWARD" in ticker:
        return False

    return (
        ticker.startswith("KXNFL")
        or "professional football" in title
        or "pro football" in title
    )

def get_markets(series_ticker):
    markets = []
    cursor = None

    while True:
        params = {
            "series_ticker": series_ticker,
            "status": "open",
            "limit": 1000
        }

        if cursor:
            params["cursor"] = cursor

        data = get_data("/markets", params)
        markets.extend(data.get("markets", []))
        cursor = data.get("cursor")

        if not cursor:
            break

    return markets

def main():
    print("Discovering Kalshi NFL markets...")

    all_series = get_all_series()
    nfl_series = [
        s for s in all_series if is_nfl_series(s)
    ]

    output = {
        "updated": datetime.now(
            timezone.utc
        ).isoformat(),
        "source": "Kalshi",
        "series": [],
        "markets": [],
        "errors": []
    }

    for series in nfl_series:
        ticker = series.get("ticker", "")

        try:
            markets = get_markets(ticker)

            output["series"].append({
                "ticker": ticker,
                "title": series.get("title"),
                "marketCount": len(markets)
            })

            for m in markets:
                output["markets"].append({
                    "series": ticker,
                    "ticker": m.get("ticker"),
                    "eventTicker": m.get("event_ticker"),
                    "title": m.get("title"),
                    "subtitle": m.get("yes_sub_title"),
                    "status": m.get("status"),
                    "strikeType": m.get("strike_type"),
                    "floorStrike": m.get("floor_strike"),
                    "capStrike": m.get("cap_strike"),
                    "yesBid": m.get("yes_bid_dollars"),
                    "yesAsk": m.get("yes_ask_dollars"),
                    "noBid": m.get("no_bid_dollars"),
                    "noAsk": m.get("no_ask_dollars"),
                    "lastPrice": m.get("last_price_dollars"),
                    "volume": m.get("volume_fp"),
                    "openInterest": m.get("open_interest_fp"),
                    "closeTime": m.get("close_time"),
                    "rules": m.get("rules_primary"),
                    "customStrike": m.get("custom_strike")
                })

            print(ticker, len(markets), "markets")

        except requests.RequestException as error:
            print("FAILED:", ticker, error)
            output["errors"].append({
                "series": ticker,
                "error": str(error)
            })

        time.sleep(0.15)

    Path("data").mkdir(exist_ok=True)

    with open(
        "data/kalshi-markets.json",
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(output, file, indent=2)

    print("NFL SERIES:", len(output["series"]))
    print("TOTAL MARKETS:", len(output["markets"]))
    print("ERRORS:", len(output["errors"]))

    if output["errors"]:
        raise RuntimeError(
            "Some NFL series failed. Check the errors."
        )

if __name__ == "__main__":
    main()
