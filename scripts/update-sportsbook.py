import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup


CBS_URL = "https://www.cbssports.com/nfl/odds/"
OUTPUT_FILE = Path("data/sportsbook-2026.json")


TEAM_CODES = {
    "ARI": "ARI",
    "ATL": "ATL",
    "BAL": "BAL",
    "BUF": "BUF",
    "CAR": "CAR",
    "CHI": "CHI",
    "CIN": "CIN",
    "CLE": "CLE",
    "DAL": "DAL",
    "DEN": "DEN",
    "DET": "DET",
    "GB": "GB",
    "HOU": "HOU",
    "IND": "IND",
    "JAX": "JAX",
    "KC": "KC",
    "LV": "LV",
    "LAC": "LAC",
    "LAR": "LA",
    "MIA": "MIA",
    "MIN": "MIN",
    "NE": "NE",
    "NO": "NO",
    "NYG": "NYG",
    "NYJ": "NYJ",
    "PHI": "PHI",
    "PIT": "PIT",
    "SF": "SF",
    "SEA": "SEA",
    "TB": "TB",
    "TEN": "TEN",
    "WAS": "WAS"
}


def clean_text(value):
    return " ".join(value.split())


def parse_number(value):
    if value is None:
        return None

    value = value.strip()

    if value in ("", "—", "-", "PK", "PICK"):
        if value in ("PK", "PICK"):
            return 0
        return None

    value = value.replace("+", "")

    try:
        return float(value)
    except ValueError:
        return None


def split_line_price(text):
    """
    Examples:

    +3 -108
    -2.5 -110
    o47.5 -115
    u48.5 -115
    """

    text = clean_text(text)

    text = text.replace("Remove Image: book logo", "")
    text = clean_text(text)

    match = re.search(
        r"([ou]?[+-]?\d+(?:\.\d+)?)\s+([+-]?\d+)",
        text,
        re.IGNORECASE
    )

    if not match:
        return None, None

    line_text = match.group(1)
    price_text = match.group(2)

    line_text = re.sub(
        r"^[ou]",
        "",
        line_text,
        flags=re.IGNORECASE
    )

    return (
        parse_number(line_text),
        parse_number(price_text)
    )


def find_team_code(text):
    """
    CBS rows begin with abbreviations such as:
    DAL Cowboys
    HOU Texans
    """

    text = clean_text(text)

    first_word = text.split()[0].upper()

    return TEAM_CODES.get(first_word)


def fetch_cbs():
    headers = {
        "User-Agent": (
            "Mozilla/5.0 "
            "(Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        )
    }

    response = requests.get(
        CBS_URL,
        headers=headers,
        timeout=30
    )

    response.raise_for_status()

    return response.text


def collect_games(html):
    soup = BeautifulSoup(html, "html.parser")

    games = []

    tables = soup.find_all("table")

    for table in tables:

        rows = table.find_all("tr")

        team_rows = []

        for row in rows:

            cells = row.find_all(["td", "th"])

            values = [
                clean_text(cell.get_text(" ", strip=True))
                for cell in cells
            ]

            if not values:
                continue

            team_code = find_team_code(values[0])

            if not team_code:
                continue

            team_rows.append(
                {
                    "team": team_code,
                    "values": values
                }
            )

        # Games should appear as pairs of team rows.
        for i in range(0, len(team_rows) - 1, 2):

            away_row = team_rows[i]
            home_row = team_rows[i + 1]

            away = away_row["team"]
            home = home_row["team"]

            away_values = away_row["values"]
            home_values = home_row["values"]

            if len(away_values) < 5:
                continue

            if len(home_values) < 5:
                continue

            # CBS visible table order:
            #
            # Team | Final | Open | Spread | ML | Total
            #
            # The "Open" value is the opening total shown
            # on the first team row and opening spread
            # information can vary by CBS markup.
            #
            # Current values are parsed from the
            # Spread / ML / Total columns.

            away_spread, away_spread_price = split_line_price(
                away_values[-3]
            )

            home_spread, home_spread_price = split_line_price(
                home_values[-3]
            )

            away_ml = parse_number(
                re.sub(
                    r"[^\d+\-.]",
                    "",
                    away_values[-2]
                )
            )

            home_ml = parse_number(
                re.sub(
                    r"[^\d+\-.]",
                    "",
                    home_values[-2]
                )
            )

            away_total, away_total_price = split_line_price(
                away_values[-1]
            )

            home_total, home_total_price = split_line_price(
                home_values[-1]
            )

            game = {
                "away": away,
                "home": home,

                "spread": {
                    "away": {
                        "open": None,
                        "openPrice": None,
                        "current": away_spread,
                        "currentPrice": away_spread_price,
                        "publicBet": None
                    },
                    "home": {
                        "open": None,
                        "openPrice": None,
                        "current": home_spread,
                        "currentPrice": home_spread_price,
                        "publicBet": None
                    }
                },

                "moneyline": {
                    "away": {
                        "open": None,
                        "current": away_ml,
                        "publicBet": None
                    },
                    "home": {
                        "open": None,
                        "current": home_ml,
                        "publicBet": None
                    }
                },

                "total": {
                    "over": {
                        "open": None,
                        "openPrice": None,
                        "current": away_total,
                        "currentPrice": away_total_price,
                        "publicBet": None
                    },
                    "under": {
                        "open": None,
                        "openPrice": None,
                        "current": home_total,
                        "currentPrice": home_total_price,
                        "publicBet": None
                    }
                }
            }

            games.append(game)

    return games


def main():
    print("Downloading CBS NFL odds...")

    html = fetch_cbs()

    print("Parsing CBS sportsbook data...")

    games = collect_games(html)

    if not games:
        raise RuntimeError(
            "No NFL games were found on the CBS odds page. "
            "Existing sportsbook data was NOT overwritten."
        )

    output = {
        "source": "CBS Sports",
        "season": 2026,
        "games": games
    }

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    OUTPUT_FILE.write_text(
        json.dumps(
            output,
            indent=2
        ),
        encoding="utf-8"
    )

    print(
        f"Saved {len(games)} games to "
        f"{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()
