
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

teams = sorted(
    set(plays["posteam"].dropna()) |
    set(plays["defteam"].dropna())
)

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

    results[team] = {
        "offensiveEPA": average(offense),
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
        "Figures are unadjusted for SOS."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(f"Saved statistics for {len(results)} teams.")
print(f"Output: {OUTPUT}")
