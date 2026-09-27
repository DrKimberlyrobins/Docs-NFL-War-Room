
# DOC'S NFL WAR ROOM
# Offensive Plays and Pace Calculator
# Source: nflverse

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

SEASON = 2026

DATA_URL = (
    "https://github.com/nflverse/nflverse-data/"
    "releases/download/pbp/"
    f"play_by_play_{SEASON}.parquet"
)

OUTPUT = Path(f"data/plays-{SEASON}.json")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

print("Downloading NFL play-by-play data...")

df = pd.read_parquet(DATA_URL)

# Regular-season games only.
df = df[df["season_type"] == "REG"].copy()

# Use the same play definition as our EPA script:
# passing or rushing plays with valid EPA.
df["epa"] = pd.to_numeric(
    df["epa"],
    errors="coerce"
)

plays = df[
    ((df["pass"] == 1) | (df["rush"] == 1))
    & df["epa"].notna()
    & df["posteam"].notna()
    & df["defteam"].notna()
].copy()

# Exclude plays that were nullified.
if "no_play" in plays.columns:
    plays = plays[plays["no_play"] != 1]

plays["qtr"] = pd.to_numeric(
    plays["qtr"],
    errors="coerce"
)

teams = sorted(
    set(plays["posteam"]) |
    set(plays["defteam"])
)

results = {}

def calculate(team_plays, team_column, team):
    selected = team_plays[
        team_plays[team_column] == team
    ]

    if selected.empty:
        return None

    # Calculate each game's play count first.
    counts = selected.groupby("game_id").size()

    if counts.empty:
        return None

    return round(float(counts.mean()), 2)

for team in teams:

    offense = plays[
        plays["posteam"] == team
    ]

    defense = plays[
        plays["defteam"] == team
    ]

    first_half_offense = offense[
        offense["qtr"].isin([1, 2])
    ]

    first_half_defense = defense[
        defense["qtr"].isin([1, 2])
    ]

    # Count all regular-season games played,
    # including games with zero qualifying plays.
    team_games = df[
        (df["home_team"] == team) |
        (df["away_team"] == team)
    ]["game_id"].dropna().nunique()

    def per_game(count):
        if not team_games:
            return None

        return round(count / team_games, 2)

    results[team] = {
        "games": int(team_games),

        "offensivePlaysPerGame": per_game(
            len(offense)
        ),

        "opponentPlaysPerGame": per_game(
            len(defense)
        ),

        "firstHalfOffensivePlays": per_game(
            len(first_half_offense)
        ),

        "firstHalfOpponentPlays": per_game(
            len(first_half_defense)
        ),

        "totalOffensivePlays": int(
            len(offense)
        ),

        "totalOpponentPlays": int(
            len(defense)
        )
    }

output = {
    "season": SEASON,
    "updated": datetime.now(
        timezone.utc
    ).isoformat(),
    "source": "nflverse",
    "definition": (
        "Regular-season passing and rushing plays "
        "with valid EPA. Excludes nullified plays "
        "when identified. First half includes "
        "quarters 1 and 2. These are EPA-eligible "
        "play counts, not every official offensive "
        "snap. Early-season samples are small."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(
    f"Saved play statistics for {len(results)} teams."
)
print(f"Output: {OUTPUT}")
