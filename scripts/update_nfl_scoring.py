
# DOC'S NFL WAR ROOM
# Automatic NFL Scoring Engine
# Source: nflverse play-by-play

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

SEASON = 2026

URL = (
    "https://github.com/nflverse/nflverse-data/"
    "releases/download/pbp/"
    f"play_by_play_{SEASON}.parquet"
)

OUTPUT = Path(f"data/scoring-{SEASON}.json")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

print("Downloading NFL scoring data...")

columns = [
    "game_id",
    "season_type",
    "home_team",
    "away_team",
    "qtr",
    "game_end",
    "total_home_score",
    "total_away_score"
]

df = pd.read_parquet(URL, columns=columns)

df = df[df["season_type"] == "REG"].copy()

for column in [
    "qtr",
    "game_end",
    "total_home_score",
    "total_away_score"
]:
    df[column] = pd.to_numeric(
        df[column], errors="coerce"
    )

games = []

for game_id, game in df.groupby(
    "game_id", sort=False
):
    game = game.copy()

    # Do not include unfinished games.
    if not (game["game_end"] == 1).any():
        continue

    # NFL play-by-play is in play order.
    # The final game-end row supplies final scores.
    final_rows = game[
        game["game_end"] == 1
    ].dropna(
        subset=[
            "total_home_score",
            "total_away_score"
        ]
    )

    if final_rows.empty:
        continue

    final = final_rows.iloc[-1]

    # Use the last recorded scoring state
    # during the second quarter.
    first_half = game[
        game["qtr"] == 2
    ].dropna(
        subset=[
            "total_home_score",
            "total_away_score"
        ]
    )

    if first_half.empty:
        continue

    halftime = first_half.iloc[-1]

    home = final["home_team"]
    away = final["away_team"]

    if pd.isna(home) or pd.isna(away):
        continue

    games.append({
        "game_id": game_id,
        "home": home,
        "away": away,
        "home_final": int(
            final["total_home_score"]
        ),
        "away_final": int(
            final["total_away_score"]
        ),
        "home_half": int(
            halftime["total_home_score"]
        ),
        "away_half": int(
            halftime["total_away_score"]
        )
    })

teams = {}

def add_game(
    team,
    opponent,
    half_scored,
    half_allowed,
    final_scored,
    final_allowed
):
    if team not in teams:
        teams[team] = []

    teams[team].append({
        "opponent": opponent,
        "half_scored": half_scored,
        "half_allowed": half_allowed,
        "final_scored": final_scored,
        "final_allowed": final_allowed
    })

for game in games:

    add_game(
        game["home"],
        game["away"],
        game["home_half"],
        game["away_half"],
        game["home_final"],
        game["away_final"]
    )

    add_game(
        game["away"],
        game["home"],
        game["away_half"],
        game["home_half"],
        game["away_final"],
        game["home_final"]
    )

results = {}

def avg(records, key):
    if not records:
        return None

    return round(
        sum(r[key] for r in records)
        / len(records),
        2
    )

for team, records in teams.items():

    results[team] = {
        "games": len(records),

        "firstHalfPointsScored": avg(
            records, "half_scored"
        ),

        "firstHalfPointsAllowed": avg(
            records, "half_allowed"
        ),

        "finalPointsScored": avg(
            records, "final_scored"
        ),

        "finalPointsAllowed": avg(
            records, "final_allowed"
        )
    }

output = {
    "season": SEASON,
    "updated": datetime.now(
        timezone.utc
    ).isoformat(),
    "source": "nflverse",
    "completedGames": len(games),
    "note": (
        "Completed regular-season games only. "
        "First-half scores use the last "
        "recorded second-quarter scoring state. "
        "Verify game-end and halftime records "
        "before relying on projections."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(
    f"Processed {len(games)} completed games."
)
print(f"Saved {len(results)} teams.")
print(f"Output: {OUTPUT}")
