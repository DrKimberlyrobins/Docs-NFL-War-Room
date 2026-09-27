
# DOC'S NFL WAR ROOM
# NFL Scoring Engine

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

df = pd.read_parquet(URL, columns=columns)
df = df[df["season_type"] == "REG"].copy()

df["qtr"] = pd.to_numeric(
    df["qtr"], errors="coerce"
)

for col in ["total_home_score", "total_away_score"]:
    df[col] = pd.to_numeric(
        df[col], errors="coerce"
    )

# Only use games with an explicit end-of-game
# record. Never include an unfinished game.
df["description"] = (
    df["desc"].fillna("").astype(str).str.upper()
)

games = []

for game_id, game in df.groupby(
    "game_id", sort=False
):
    end_rows = game[
        (game["qtr"] >= 4) &
        game["description"].str.contains(
            r"END OF GAME|END GAME",
            regex=True
        )
    ]

    if end_rows.empty:
        print(f"Skipping unverified game: {game_id}")
        continue

    # The score columns describe the score
    # before each play. Use the last recorded
    # score at the end of the game.
    final = end_rows.iloc[-1]

    first_half = game[
        (game["qtr"] == 2) &
        game["description"].str.contains(
            r"END OF HALF|END OF 1ST HALF|HALFTIME",
            regex=True
        )
    ]

    if first_half.empty:
        print(f"Missing halftime record: {game_id}")
        continue

    halftime = first_half.iloc[-1]

    scores = [
        final["total_home_score"],
        final["total_away_score"],
        halftime["total_home_score"],
        halftime["total_away_score"]
    ]

    if any(pd.isna(score) for score in scores):
        continue

    home = final["home_team"]
    away = final["away_team"]

    if pd.isna(home) or pd.isna(away):
        continue

    games.append({
        "home": home,
        "away": away,
        "home_final": int(scores[0]),
        "away_final": int(scores[1]),
        "home_half": int(scores[2]),
        "away_half": int(scores[3])
    })

teams = {}

def record(team, scored_half, allowed_half,
           scored_final, allowed_final):

    teams.setdefault(team, []).append({
        "half_scored": scored_half,
        "half_allowed": allowed_half,
        "final_scored": scored_final,
        "final_allowed": allowed_final
    })

for g in games:
    record(
        g["home"],
        g["home_half"],
        g["away_half"],
        g["home_final"],
        g["away_final"]
    )

    record(
        g["away"],
        g["away_half"],
        g["home_half"],
        g["away_final"],
        g["home_final"]
    )

def average(records, key):
    return round(
        sum(r[key] for r in records) / len(records),
        2
    )

results = {}

for team, records in teams.items():
    results[team] = {
        "games": len(records),
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
        "Only games with explicit game-end and "
        "halftime markers are included. "
        "Check processed game count and scores."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(f"Processed {len(games)} games.")

# Do not publish empty or obviously incomplete data.
if len(games) == 0:
    OUTPUT.unlink(missing_ok=True)
    raise RuntimeError(
        "No verified completed games found. "
        "Check nflverse scoring markers."
    )
