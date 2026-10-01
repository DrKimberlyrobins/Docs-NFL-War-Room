
# DOC'S NFL WAR ROOM
# AUTOMATIC PLAYER GAME LOGS
# Passing, rushing and receiving

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

OUTPUT = Path(f"data/player-gamelogs-{SEASON}.json")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

print("Downloading NFL game logs...")
df = pd.read_parquet(URL)

required = [
    "game_id",
    "season_type",
    "posteam",
    "qtr",
    "desc",
    "pass_attempt",
    "passer_player_name",
    "passing_yards",
    "rush_attempt",
    "rusher_player_id",
    "rusher_player_name",
    "rushing_yards",
    "receiver_player_id",
    "receiver_player_name",
    "receiving_yards"
]

missing = [c for c in required if c not in df.columns]

if missing:
    raise RuntimeError(
        "Missing source columns: " + ", ".join(missing)
    )

# Regular season only.
df = df[df["season_type"] == "REG"].copy()

df["qtr"] = pd.to_numeric(
    df["qtr"], errors="coerce"
)

descriptions = df["desc"].fillna("").astype(str)

# Match the completion rule used by our player updater.
completed = df.loc[
    (df["qtr"] >= 4) &
    descriptions.str.contains(
        r"END OF GAME|END GAME",
        case=False,
        regex=True
    ),
    "game_id"
].dropna().unique()

df = df[df["game_id"].isin(completed)].copy()

if df.empty:
    raise RuntimeError("No completed games found.")

numeric_columns = [
    "pass_attempt",
    "passing_yards",
    "rush_attempt",
    "rushing_yards",
    "receiving_yards"
]

for column in numeric_columns:
    df[column] = pd.to_numeric(
        df[column], errors="coerce"
    ).fillna(0)

# Each category is calculated independently.
categories = {
    "passing": {
        "flag": "pass_attempt",
        "name": "passer_player_name",
        "id": None,
        "yards": "passing_yards"
    },
    "rushing": {
        "flag": "rush_attempt",
        "name": "rusher_player_name",
        "id": "rusher_player_id",
        "yards": "rushing_yards"
    },
    "receiving": {
        "flag": "pass_attempt",
        "name": "receiver_player_name",
        "id": "receiver_player_id",
        "yards": "receiving_yards"
    }
}

results = []

for category, config in categories.items():
    plays = df[
        (df[config["flag"]] == 1) &
        df[config["name"]].notna() &
        df["posteam"].notna()
    ].copy()

    group_columns = [
        "game_id",
        "posteam",
        config["name"]
    ]

    if config["id"]:
        plays = plays[
            plays[config["id"]].notna()
        ].copy()
        group_columns.append(config["id"])

    for keys, group in plays.groupby(group_columns):
        game_id = str(keys[0])
        team = str(keys[1])
        name = str(keys[2])

        player_id = (
            str(keys[3])
            if config["id"]
            else None
        )

        yards = float(
            group[config["yards"]].sum()
        )

        results.append({
            "gameId": game_id,
            "team": team,
            "playerId": player_id,
            "player": name,
            "category": category,
            "yards": round(yards, 1),
            "opportunities": int(len(group))
        })

results.sort(
    key=lambda r: (
        r["team"],
        r["player"],
        r["category"],
        r["gameId"]
    )
)

output = {
    "season": SEASON,
    "updated": datetime.now(
        timezone.utc
    ).isoformat(),
    "source": "nflverse play-by-play",
    "completedGames": len(completed),
    "note": (
        "Completed regular-season games only. "
        "One record per observed player, game "
        "and statistical category. "
        "Players with no recorded opportunities "
        "in a category are not included for "
        "that game. Missing records must not "
        "automatically be treated as zero. "
        "Verify against official game logs."
    ),
    "logs": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print("Completed games:", len(completed))
print("Player game-log records:", len(results))
print("Saved:", OUTPUT)
