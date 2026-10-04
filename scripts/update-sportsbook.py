import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup


CBS_URL = "https://www.cbssports.com/nfl/odds/"
OUTPUT_FILE = Path("data/sportsbook-2026.json")


TEAM_CODES = {
    "ARI": "ARI", "ATL": "ATL", "BAL": "BAL", "BUF": "BUF",
    "CAR": "CAR", "CHI": "CHI", "CIN": "CIN", "CLE": "CLE",
    "DAL": "DAL", "DEN": "DEN", "DET": "DET", "GB": "GB",
    "HOU": "HOU", "IND": "IND", "JAX": "JAX", "JAC": "JAX",
    "KC": "KC", "LV": "LV", "LAC": "LAC", "LAR": "LA",
    "LA": "LA", "MIA": "MIA", "MIN": "MIN", "NE": "NE",
    "NO": "NO", "NYG": "NYG", "NYJ": "NYJ", "PHI": "PHI",
    "PIT": "PIT", "SF": "SF", "SEA": "SEA", "TB": "TB",
    "TEN": "TEN", "WAS": "WAS"
}


TEAM_NAMES = {
    "ARI": "Arizona Cardinals",
    "ATL": "Atlanta Falcons",
    "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills",
    "CAR": "Carolina Panthers",
    "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals",
    "CLE": "Cleveland Browns",
    "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos",
    "DET": "Detroit Lions",
    "GB": "Green Bay Packers",
    "HOU": "Houston Texans",
    "IND": "Indianapolis Colts",
    "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs",
    "LV": "Las Vegas Raiders",
    "LAC": "Los Angeles Chargers",
    "LA": "Los Angeles Rams",
    "MIA": "Miami Dolphins",
    "MIN": "Minnesota Vikings",
    "NE": "New England Patriots",
    "NO": "New Orleans Saints",
    "NYG": "New York Giants",
    "NYJ": "New York Jets",
    "PHI": "Philadelphia Eagles",
    "PIT": "Pittsburgh Steelers",
    "SF": "San Francisco 49ers",
    "SEA": "Seattle Seahawks",
    "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans",
    "WAS": "Washington Commanders"
}


def clean_text(value):
    return " ".join(str(value).split())


def parse_number(value):
    if value is None:
        return None

    value = str(value).strip().upper()

    if value in ("", "—", "-", "N/A"):
        return None

    if value in ("PK", "PICK", "EVEN"):
        return 0.0

    value = value.replace("+", "")

    try:
        return float(value)
    except ValueError:
        return None


def team_label(code):
    return f"{code} — {TEAM_NAMES.get(code, code)}"


def find_team_code(text):
    text = clean_text(text)

    if not text:
        return None

    first_word = text.split()[0].upper()

    return TEAM_CODES.get(first_word)


def split_line_price(text):
    """
    Handles:
      -3.5 -122
      +4.5 -114
      o47.5 -105
      u47.5 -112
    """

    if text is None:
        return None, None

    text = clean_text(text)

    match = re.search(
        r"([ou]?[+-]?\d+(?:\.\d+)?)\s+([+-]\d+)",
        text,
        re.IGNORECASE
    )

    if not match:
        return None, None

    line_text = re.sub(
        r"^[ou]",
        "",
        match.group(1),
        flags=re.IGNORECASE
    )

    line = parse_number(line_text)
    price = parse_number(match.group(2))

    return line, price


def classify_open(text):
    """
    CBS Open column examples:

      o47.5 -106
      +3.5 -108

    Returns:
      type, line, price
    """

    if text is None:
        return None, None, None

    text = clean_text(text)

    total_match = re.search(
        r"\b[ou]\s*([0-9]+(?:\.[0-9]+)?)\s+([+-]\d+)",
        text,
        re.IGNORECASE
    )

    if total_match:
        return (
            "total",
            parse_number(total_match.group(1)),
            parse_number(total_match.group(2))
        )

    spread_match = re.search(
        r"(?<!\w)([+-]\d+(?:\.\d+)?)\s+([+-]\d+)",
        text
    )

    if spread_match:
        return (
            "spread",
            parse_number(spread_match.group(1)),
            parse_number(spread_match.group(2))
        )

    pk_match = re.search(
        r"\b(?:PK|PICK)\b(?:\s+([+-]\d+))?",
        text,
        re.IGNORECASE
    )

    if pk_match:
        price = (
            parse_number(pk_match.group(1))
            if pk_match.group(1)
            else None
        )

        return "spread", 0.0, price

    return None, None, None


def first_number(text):
    if text is None:
        return None

    text = clean_text(text)

    match = re.search(
        r"(?<!\w)([+-]\d+)",
        text
    )

    if not match:
        return None

    return parse_number(match.group(1))


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


def extract_rows(table):
    rows = []

    for row in table.find_all("tr"):
        cells = row.find_all(["td", "th"])

        values = [
            clean_text(
                cell.get_text(" ", strip=True)
            )
            for cell in cells
        ]

        if not values:
            continue

        team_code = find_team_code(values[0])

        if not team_code:
            continue

        rows.append({
            "team": team_code,
            "values": values
        })

    return rows


def collect_games(html):
    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    games = []
    seen_games = set()

    for table in soup.find_all("table"):

        team_rows = extract_rows(table)

        if len(team_rows) < 2:
            continue

        for i in range(0, len(team_rows) - 1, 2):

            away_row = team_rows[i]
            home_row = team_rows[i + 1]

            away = away_row["team"]
            home = home_row["team"]

            if away == home:
                continue

            game_key = (away, home)

            if game_key in seen_games:
                continue

            away_values = away_row["values"]
            home_values = home_row["values"]

            if (
                len(away_values) < 5 or
                len(home_values) < 5
            ):
                continue

            # CBS:
            # Team | Final | Open | Spread | ML | Total

            away_open_text = away_values[-4]
            home_open_text = home_values[-4]

            (
                away_open_type,
                away_open_value,
                away_open_price
            ) = classify_open(away_open_text)

            (
                home_open_type,
                home_open_value,
                home_open_price
            ) = classify_open(home_open_text)


            # ---------------------------------------------
            # OPENING SPREAD
            # ---------------------------------------------

            opening_spread_away = None
            opening_spread_home = None

            opening_spread_price_away = None
            opening_spread_price_home = None


            if away_open_type == "spread":

                opening_spread_away = away_open_value
                opening_spread_price_away = away_open_price

                if away_open_value is not None:
                    opening_spread_home = -away_open_value


            if home_open_type == "spread":

                opening_spread_home = home_open_value
                opening_spread_price_home = home_open_price

                if home_open_value is not None:
                    opening_spread_away = -home_open_value


            # IMPORTANT:
            # CBS may only display the opening spread price
            # on the row containing the displayed opener.
            # We do NOT invent the opposite side's juice.


            # ---------------------------------------------
            # OPENING TOTAL
            # ---------------------------------------------

            opening_total = None
            opening_total_price = None


            if away_open_type == "total":
                opening_total = away_open_value
                opening_total_price = away_open_price


            if home_open_type == "total":
                opening_total = home_open_value
                opening_total_price = home_open_price


            # ---------------------------------------------
            # CURRENT SPREAD
            # ---------------------------------------------

            (
                away_spread,
                away_spread_price
            ) = split_line_price(
                away_values[-3]
            )

            (
                home_spread,
                home_spread_price
            ) = split_line_price(
                home_values[-3]
            )


            # ---------------------------------------------
            # CURRENT MONEYLINE
            # ---------------------------------------------

            away_ml = first_number(
                away_values[-2]
            )

            home_ml = first_number(
                home_values[-2]
            )


            # ---------------------------------------------
            # CURRENT TOTAL
            # ---------------------------------------------

            (
                away_total,
                away_total_price
            ) = split_line_price(
                away_values[-1]
            )

            (
                home_total,
                home_total_price
            ) = split_line_price(
                home_values[-1]
            )


            if (
                away_spread is None
                and home_spread is None
                and away_ml is None
                and home_ml is None
                and away_total is None
                and home_total is None
            ):
                continue


            game = {

                "away": away,
                "home": home,

                "awayName": TEAM_NAMES.get(
                    away,
                    away
                ),

                "homeName": TEAM_NAMES.get(
                    home,
                    home
                ),

                "awayLabel": team_label(away),
                "homeLabel": team_label(home),

                "matchup": (
                    f"{team_label(away)} @ "
                    f"{team_label(home)}"
                ),

                "spread": {

                    "away": {
                        "open": opening_spread_away,
                        "openPrice": opening_spread_price_away,
                        "current": away_spread,
                        "currentPrice": away_spread_price,
                        "publicBet": None
                    },

                    "home": {
                        "open": opening_spread_home,
                        "openPrice": opening_spread_price_home,
                        "current": home_spread,
                        "currentPrice": home_spread_price,
                        "publicBet": None
                    }
                },

                "moneyline": {

                    "away": {
                        "open": None,
                        "openPrice": None,
                        "current": away_ml,
                        "currentPrice": away_ml,
                        "publicBet": None
                    },

                    "home": {
                        "open": None,
                        "openPrice": None,
                        "current": home_ml,
                        "currentPrice": home_ml,
                        "publicBet": None
                    }
                },

                "total": {

                    "over": {
                        "open": opening_total,
                        "openPrice": opening_total_price,
                        "current": away_total,
                        "currentPrice": away_total_price,
                        "publicBet": None
                    },

                    "under": {
                        "open": opening_total,
                        "openPrice": None,
                        "current": home_total,
                        "currentPrice": home_total_price,
                        "publicBet": None
                    }
                }
            }

            games.append(game)
            seen_games.add(game_key)

    return games


def main():

    print("Downloading CBS NFL odds...")

    html = fetch_cbs()

    print("Parsing CBS sportsbook data...")

    games = collect_games(html)

    if not games:
        raise RuntimeError(
            "No NFL games were found. "
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
        f"Saved {len(games)} games "
        f"to {OUTPUT_FILE}"
    )

    # ---------------------------------------------
    # DOC'S FIRST LIVE WAR ROOM EXAMPLE
    # ---------------------------------------------

    for game in games:

        if (
            game["away"] == "IND"
            and game["home"] == "WAS"
        ):

            print()
            print("======================================")
            print("DOC'S FIRST WAR ROOM EXAMPLE")
            print("======================================")
            print(game["matchup"])
            print()
            print(
                json.dumps(
                    game,
                    indent=2
                )
            )
            print("======================================")
            return

    print(
        "WARNING: IND — Indianapolis Colts @ "
        "WAS — Washington Commanders not found."
    )


if __name__ == "__main__":
    main()
