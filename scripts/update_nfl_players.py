
# DOC'S NFL WAR ROOM
# AUTOMATIC QB AND RECEIVER DATA UPDATER

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

OUTPUT = Path(f"data/players-{SEASON}.json")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

print("Downloading NFL player data...")

# Read the source and inspect its columns.
# This avoids requesting unavailable columns.
df = pd.read_parquet(URL)

required = [
    "game_id",
    "season_type",
    "posteam",
    "defteam",
    "qtr",
    "desc",
    "pass_attempt",
    "complete_pass",
    "passer_player_name",
    "receiver_player_id",
    "receiver_player_name",
    "receiving_yards",
    "yards_after_catch",
    "passing_yards",
    "pass_touchdown",
    "interception",
    "yardline_100",
    "touchdown"
]

missing = [
    col for col in required
    if col not in df.columns
]

if missing:
    raise RuntimeError(
        "Missing source columns: " +
        ", ".join(missing)
    )

df = df[df["season_type"] == "REG"].copy()

for col in [
    "qtr",
    "pass_attempt",
    "complete_pass",
    "receiving_yards",
    "yards_after_catch",
    "passing_yards",
    "pass_touchdown",
    "interception",
    "yardline_100",
    "touchdown"
]:
    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )

# Only use completed games.
descriptions = (
    df["desc"]
    .fillna("")
    .astype(str)
    .str.upper()
)

completed = df.loc[
    (df["qtr"] >= 4) &
    descriptions.str.contains(
        r"END OF GAME|END GAME",
        regex=True
    ),
    "game_id"
].dropna().unique()

df = df[
    df["game_id"].isin(completed)
].copy()

if df.empty:
    raise RuntimeError(
        "No verified completed games found."
    )

print(
    f"Processing {len(completed)} "
    "completed games..."
)

# Count games played by each team.
team_games = {}

for game_id, game in df.groupby("game_id"):
    for team in game["posteam"].dropna().unique():
        team_games.setdefault(
            str(team), set()
        ).add(str(game_id))

# Identify QB passing attempts.
passes = df[
    (df["pass_attempt"] == 1) &
    df["passer_player_name"].notna() &
    df["posteam"].notna()
].copy()

quarterbacks = {}

for (team, name), group in passes.groupby(
    ["posteam", "passer_player_name"]
):
    attempts = len(group)

    completions = int(
        (group["complete_pass"] == 1).sum()
    )
    passing_yards = float(
        group["passing_yards"].fillna(0).sum()
    )

    passing_tds = int(
        (group["pass_touchdown"] == 1).sum()
    )

    interceptions = int(
        (group["interception"] == 1).sum()
    )

    yards_per_attempt = (
        round(passing_yards / attempts, 2)
        if attempts else None
    )

    quarterbacks.setdefault(
        str(team), []
    ).append({
        "name": str(name),
        "attempts": attempts,
        "completions": completions,
        "passingYards": round(passing_yards, 1),
        "passingTDs": passing_tds,
        "interceptions": interceptions,
        "yardsPerAttempt": yards_per_attempt,
        "completionRate": round(
            completions / attempts * 100, 1
        ) if attempts else None,
        "attemptsPerTeamGame": round(
            attempts / len(
                team_games.get(str(team), {1})
            ), 2
        )
    })

# Defensive matchup statistics
defensive_stats = {}
# Identify receiver targets.
targets = df[
    (df["pass_attempt"] == 1) &
    df["receiver_player_id"].notna() &
    df["receiver_player_name"].notna() &
    df["posteam"].notna()
].copy()

receivers = {}

for (team, player_id, name), group in targets.groupby(
    [
        "posteam",
        "receiver_player_id",
        "receiver_player_name"
    ]
):
    target_count = len(group)

    catches = int(
        (group["complete_pass"] == 1).sum()
    )

    yards = float(
        group["receiving_yards"]
        .fillna(0)
        .sum()
    )
        # Total yards gained after catching the ball
    yac = float(
        group.loc[
            group["complete_pass"] == 1,
            "yards_after_catch"
        ].fillna(0).sum()
    )

    # Average yards after catch per reception
    yac_per_reception = (
        round(yac / catches, 2)
        if catches else None
    )
        # Receptions gaining 20 or more yards
    explosive_receptions = int(
        (
            (group["complete_pass"] == 1) &
            (group["receiving_yards"] >= 20)
        ).sum()
    )

    # Percentage of catches that were explosive
    explosive_rate = (
        round(
            explosive_receptions / catches * 100,
            1
        )
        if catches else None
    )

    red_zone = int(
        (group["yardline_100"] <= 20).sum()
    )

    inside_ten = int(
        (group["yardline_100"] <= 10).sum()
    )

    touchdowns = int(
        (
            (group["touchdown"] == 1) &
            (group["complete_pass"] == 1)
        ).sum()
    )

    games = len(
        team_games.get(str(team), {1})
    )

    receivers.setdefault(
        str(team), []
    ).append({
        "id": str(player_id),
        "name": str(name),
        "targets": target_count,
        "targetsPerGame": round(
            target_count / games, 2
        ),
        "receptions": catches,
        "receptionsPerGame": round(
            catches / games, 2
        ),
        "receivingYards": round(
            yards, 1
        ),
        "yardsAfterCatch": round(yac, 1),
        "yacPerReception": yac_per_reception,
        "explosiveReceptions": explosive_receptions,
        "explosiveRate": explosive_rate,
        "yardsPerGame": round(
            yards / games, 2
        ),
        "catchRate": round(
            catches / target_count * 100, 1
        ),
        "redZoneTargets": red_zone,
        "inside10Targets": inside_ten,
        "receivingTouchdowns": touchdowns
    })

# Calculate receiving production allowed by each defense.
defensive_plays = df[
    (df["pass_attempt"] == 1) &
    df["defteam"].notna() &
    df["receiver_player_id"].notna()
].copy()

for team, group in defensive_plays.groupby("defteam"):

    catches = group[
        group["complete_pass"] == 1
    ]

    explosive_allowed = int(
        (catches["receiving_yards"] >= 20).sum()
    )

    yac_allowed = float(
        catches["yards_after_catch"].fillna(0).sum()
    )

        # Count completed games faced by this defense
    defensive_games = df.loc[
        df["defteam"] == team,
        "game_id"
    ].nunique()

    explosive_per_game = (
        round(explosive_allowed / defensive_games, 2)
        if defensive_games else None
    )

    yac_per_game = (
        round(yac_allowed / defensive_games, 2)
        if defensive_games else None
    )
    defensive_stats[str(team)] = {
        "games": int(defensive_games),
        "explosiveReceptionsAllowed": explosive_allowed,
        "explosiveReceptionsAllowedPerGame": explosive_per_game,
        "yardsAfterCatchAllowed": round(yac_allowed, 1),
        "yardsAfterCatchAllowedPerGame": yac_per_game
    }
# Sort QBs by passing attempts and
# receivers by total targets.
for team in quarterbacks:
    quarterbacks[team].sort(
        key=lambda p: p["attempts"],
        reverse=True
    )

for team in receivers:
    receivers[team].sort(
        key=lambda p: p["targets"],
        reverse=True
    )

all_teams = sorted(
    set(team_games) |
    set(quarterbacks) |
    set(receivers)
)

results = {}

for team in all_teams:
    results[team] = {
        "games": len(
            team_games.get(team, set())
        ),
        "quarterbacks": quarterbacks.get(
            team, []
        ),
        "receivers": receivers.get(
            team, []
        )
    }

# Attach defensive statistics to each team.
for team in results:
    results[team]["defense"] = defensive_stats.get(
        team, {}
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
        "Passing attempts exclude sacks. "
        "Receiver statistics use recorded "
        "targets. Per-game averages use "
        "completed team games, not individual "
        "player appearances. Red-zone targets "
        "are passes from the opponent's 20 "
        "or closer; inside-10 targets are "
        "from the opponent's 10 or closer. "
        "Verify totals against official stats."
    ),
    "teams": results
}

OUTPUT.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print(
    f"Processed {len(completed)} games."
)
print(
    f"Saved {len(results)} teams."
)
print(f"Output: {OUTPUT}")
