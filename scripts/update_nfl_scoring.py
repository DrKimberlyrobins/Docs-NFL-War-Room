
# DOC'S NFL WAR ROOM
# AUTOMATIC NFL SCORING ENGINE
# Data source: nflverse

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
    "desc",
    "total_home_score",
    "total_away_score"
]

df = pd.read_parquet(
    URL,
    columns=columns
)

df = df[
    df["season_type"] == "REG"
].copy()

df["qtr"] = pd.to_numeric(
    df["qtr"],
    errors="coerce"
)

for col in [
    "total_home_score",
    "total_away_score"
]:
    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )

df["description"] = (
    df["desc"]
    .fillna("")
    .astype(str)
    .str.upper()
)

games = []

for game_id, game in df.groupby(
    "game_id",
    sort=False
):

    # Require an explicit game-end record.
    end_rows = game[
        (game["qtr"] >= 4) &
        game["description"].str.contains(
            r"END OF GAME|END GAME",
            regex=True
        )
    ]

    if end_rows.empty:
        print(
            f"Skipping unfinished or "
            f"unverified game: {game_id}"
        )
        continue

    # The end-of-game record provides
    # the final scoring state.
    final = end_rows.iloc[-1]

    # Scores are recorded before each play.
    # The first third-quarter record gives
    # the score entering the second half.
    third_quarter = game[
        game["qtr"] == 3
    ].dropna(
        subset=[
            "total_home_score",
            "total_away_score"
        ]
    )

    if third_quarter.empty:
        print(
            f"Missing third quarter: {game_id}"
        )
        continue

    halftime = third_quarter.iloc[0]

    scores = [
        final["total_home_score"],
        final["total_away_score"],
        halftime["total_home_score"],
        halftime["total_away_score"]
    ]

    if any(
        pd.isna(score)
        for score in scores
    ):
        continue

    home = final["home_team"]
    away = final["away_team"]

    if pd.isna(home) or pd.isna(away):
        continue

    games.append({
        "game_id": str(game_id),
        "home": str(home),
        "away": str(away),
        "home_final": int(scores[0]),
        "away_final": int(scores[1]),
        "home_half": int(scores[2]),
        "away_half": int(scores[3])
    })

# Never publish an empty dataset.
if not games:
    raise RuntimeError(
        "No completed games verified. "
        "Check the scoring data."
    )

teams = {}

def record(
    team,
    half_scored,
    half_allowed,
    final_scored,
    final_allowed
):
    teams.setdefault(
        team, []
    ).append({
        "half_scored": half_scored,
        "half_allowed": half_allowed,
        "final_scored": final_scored,
        "final_allowed": final_allowed
    })

for game in games:

    record(
        game["home"],
        game["home_half"],
        game["away_half"],
        game["home_final"],
        game["away_final"]
    )

    record(
        game["away"],
        game["away_half"],
        game["home_half"],
        game["away_final"],
        game["home_final"]
    )

def average(records, key):
    return round(
        sum(
            item[key]
            for item in records
        ) / len(records),
        2
    )

results = {}

for team, records in teams.items():

    results[team] = {
        "games": len(records),

        "firstHalfPointsScored": average(
            records,
            "half_scored"
        ),

        "firstHalfPointsAllowed": average(
            records,
            "half_allowed"
        ),

        "finalPointsScored": average(
            records,
            "final_scored"
        ),

        "finalPointsAllowed": average(
            records,
            "final_allowed"
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
        "Halftime scores use the first "
        "third-quarter scoring state. "
        "Verify results against official "
        "game scores before forecasting."
    ),
    "teams": results
}

# Save only after successfully
# processing completed games.
OUTPUT.write_text(
    json.dumps(
        output,
        indent=2
    ),
    encoding="utf-8"
)

print(
    f"Processed {len(games)} "
    "completed games."
)

print(
    f"Saved scoring data "
    f"for {len(results)} teams."
)

print(f"Output: {OUTPUT}")
