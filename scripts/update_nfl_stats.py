
# DOC'S NFL WAR ROOM
# Automatic NFL EPA calculations
# Data source: nflverse

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests

SEASON = 2026

DATA_URL = (
    "https://github.com/nflverse/nflverse-data/"
    "releases/download/pbp/"
    f"play_by_play_{SEASON}.parquet"
)

OUTPUT = Path(f"data/epa-{SEASON}.json")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

print("Downloading NFL play-by-play data...")

response = requests.get(
    DATA_URL,
    timeout=120
)
response.raise_for_status()

TEMP_FILE = Path("nfl_pbp.parquet")
TEMP_FILE.write_bytes(response.content)

df = pd.read_parquet(TEMP_FILE)
TEMP_FILE.unlink()

# Include regular-season plays only.
df = df[df["season_type"] == "REG"].copy()
# Only include completed regular-season games.
completed_games = df.groupby("game_id").filter(
    lambda game: (
        (game["qtr"] >= 4)
        & game["desc"].fillna("").str.contains(
            r"END OF GAME|END GAME",
            case=False,
            regex=True
        )
    ).any()
)

df = completed_games.copy()

# Remove plays without usable EPA.
df["epa"] = pd.to_numeric(
    df["epa"],
    errors="coerce"
)
df = df.dropna(subset=["epa"])

# Keep actual passing and rushing plays.
plays = df[
    (df["pass"] == 1) |
    (df["rush"] == 1)
].copy()
# Identify games and opponents for SOS.
required_sos_columns = [
    "game_id",
    "posteam",
    "defteam"
]

missing_sos = [
    col for col in required_sos_columns
    if col not in plays.columns
]

if missing_sos:
    raise RuntimeError(
        "Missing SOS columns: " +
        ", ".join(missing_sos)
    )

teams = sorted(
    set(plays["posteam"].dropna()) |
    set(plays["defteam"].dropna())
)
# Calculate each team's opponents' offensive EPA.
opponent_epa = (
    plays.groupby("posteam")["epa"]
    .mean()
    .to_dict()
)

# Identify each team's unique opponents by game.
team_opponents = {}

for (game_id, team), group in plays.groupby(
    ["game_id", "posteam"]
):
    opponents = group["defteam"].dropna().unique()

    for opponent in opponents:
        team_opponents.setdefault(
            str(team), set()
        ).add(str(opponent))
results = {}

def average(data):
    if data.empty:
        return None

    value = data["epa"].mean()

    if pd.isna(value):
        return None

    return round(float(value), 4)

for team in teams:

    offense = plays[
        plays["posteam"] == team
    ]

    defense = plays[
        plays["defteam"] == team
    ]

    passing = offense[
        offense["pass"] == 1
    ]

    rushing = offense[
        offense["rush"] == 1
    ]

    pass_defense = defense[
        defense["pass"] == 1
    ]

    rush_defense = defense[
        defense["rush"] == 1
    ]

        # Average offensive EPA of previous opponents
    opponents = team_opponents.get(str(team), set())

    opponent_values = [
        opponent_epa[opponent]
        for opponent in opponents
        if opponent in opponent_epa
        and pd.notna(opponent_epa[opponent])
    ]

    sos = (
        round(
            sum(opponent_values) / len(opponent_values),
            4
        )
        if opponent_values else None
    )
    results[team] = {
        "offensiveEPA": average(offense),
        "offensiveSOS": sos,
        "defensiveEPAAllowed": average(defense),
        "passingEPA": average(passing),
        "rushingEPA": average(rushing),
        "passingEPAAllowed": average(pass_defense),
        "rushingEPAAllowed": average(rush_defense),
        "offensivePlays": len(offense),
        "defensivePlays": len(defense)
    }

output = {
    "season": SEASON,
    "updated": datetime.now(
        timezone.utc
    ).isoformat(),
    "source": "nflverse",
    "note": (
        "Regular-season EPA per passing or "
        "rushing play. Defensive EPA is "
        "EPA allowed; lower is better. "
        "Offensive SOS is the average offensive EPA "
        "of unique opponents faced. EPA figures "
        "are not adjusted for SOS."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(f"Saved statistics for {len(results)} teams.")
print(f"Output: {OUTPUT}")
print(
    "Completed regular-season games:",
    df["game_id"].nunique()
)

print(
    "Teams with SOS:",
    sum(
        1 for team in results.values()
        if team["offensiveSOS"] is not None
    )
)
