
# DOC'S NFL WAR ROOM
# 1Q, 1H AND FULL-GAME SCORING ENGINE

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

columns = [
    "game_id",
    "season_type",
    "home_team",
    "away_team",
    "qtr",
    "desc",
    "total_home_score",
    "total_away_score"
]

print("Downloading NFL scoring data...")

df = pd.read_parquet(URL, columns=columns)
df = df[df["season_type"] == "REG"].copy()

for col in [
    "qtr",
    "total_home_score",
    "total_away_score"
]:
    df[col] = pd.to_numeric(
        df[col], errors="coerce"
    )

df["description"] = (
    df["desc"].fillna("").astype(str).str.upper()
)

games = []

for game_id, game in df.groupby(
    "game_id", sort=False
):

    # Only accept verified completed games.
    end_rows = game[
        (game["qtr"] >= 4) &
        game["description"].str.contains(
            r"END OF GAME|END GAME",
            regex=True
        )
    ]

    if end_rows.empty:
        continue

    # nflverse total scores describe the
    # score entering each play.
    # The first record of the next quarter
    # captures the preceding quarter's score.

    second = game[
        game["qtr"] == 2
    ].dropna(
        subset=[
            "total_home_score",
            "total_away_score"
        ]
    )

    third = game[
        game["qtr"] == 3
    ].dropna(
        subset=[
            "total_home_score",
            "total_away_score"
        ]
    )

    if second.empty or third.empty:
        print(f"Missing quarter data: {game_id}")
        continue

    first_quarter = second.iloc[0]
    halftime = third.iloc[0]
    final = end_rows.iloc[-1]

    values = [
        first_quarter["total_home_score"],
        first_quarter["total_away_score"],
        halftime["total_home_score"],
        halftime["total_away_score"],
        final["total_home_score"],
        final["total_away_score"]
    ]

    if any(pd.isna(value) for value in values):
        continue

    home = final["home_team"]
    away = final["away_team"]

    if pd.isna(home) or pd.isna(away):
        continue

    games.append({
        "game_id": str(game_id),
        "home": str(home),
        "away": str(away),
        "home_q1": int(values[0]),
        "away_q1": int(values[1]),
        "home_half": int(values[2]),
        "away_half": int(values[3]),
        "home_final": int(values[4]),
        "away_final": int(values[5])
    })

if not games:
    raise RuntimeError(
        "No verified completed games found."
    )

teams = {}

def record(
    team,
    q1_scored,
    q1_allowed,
    half_scored,
    half_allowed,
    final_scored,
    final_allowed
):
    teams.setdefault(team, []).append({
        "q1_scored": q1_scored,
        "q1_allowed": q1_allowed,
        "half_scored": half_scored,
        "half_allowed": half_allowed,
        "final_scored": final_scored,
        "final_allowed": final_allowed
    })

for g in games:

    record(
        g["home"],
        g["home_q1"],
        g["away_q1"],
        g["home_half"],
        g["away_half"],
        g["home_final"],
        g["away_final"]
    )

    record(
        g["away"],
        g["away_q1"],
        g["home_q1"],
        g["away_half"],
        g["home_half"],
        g["away_final"],
        g["home_final"]
    )

def average(records, key):
    return round(
        sum(r[key] for r in records)
        / len(records),
        2
    )

results = {}

for team, records in teams.items():

    results[team] = {
        "games": len(records),

        "firstQuarterPointsScored": average(
            records, "q1_scored"
        ),

        "firstQuarterPointsAllowed": average(
            records, "q1_allowed"
        ),

        "firstHalfPointsScored": average(
            records, "half_scored"
        ),

        "firstHalfPointsAllowed": average(
            records, "half_allowed"
        ),

        "finalPointsScored": average(
            records, "final_scored"
        ),

        "finalPointsAllowed": average(
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
        "First-quarter scores use the first "
        "second-quarter scoring state. "
        "Halftime scores use the first "
        "third-quarter scoring state. "
        "Verify results against official scores."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(f"Processed {len(games)} games.")
print(f"Saved {len(results)} teams.")
print(f"Output: {OUTPUT}")
