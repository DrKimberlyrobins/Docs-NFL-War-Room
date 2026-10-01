
# DOC'S NFL WAR ROOM
# PLAYER PERFORMANCE AND PROBABILITY PREPARATION

import json
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SEASON = 2026

source = Path(f"data/player-gamelogs-{SEASON}.json")
destination = Path(
    f"data/player-projections-{SEASON}.json"
)

data = json.loads(source.read_text(encoding="utf-8"))

# Organize observations by team, player and category.
players = defaultdict(lambda: defaultdict(dict))

for log in data["logs"]:
    key = (
        log["team"],
        log["playerId"] or log["player"]
    )

    players[key][log["category"]][
        log["gameId"]
    ] = {
        "yards": float(log["yards"]),
        "name": log["player"]
    }

results = []

def summarize(games):
    values = [
        entry["yards"]
        for entry in games.values()
    ]

    count = len(values)

    return {
        "recordedGames": count,
        "averageYards": round(
            statistics.mean(values), 2
        ) if values else None,
        "standardDeviation": round(
            statistics.stdev(values), 2
        ) if count >= 2 else None,
        "lowestYards": min(values) if values else None,
        "highestYards": max(values) if values else None,
        "probabilityStatus": (
            "Insufficient verified games"
            if count < 6
            else "Requires model validation"
        ),
        "projectedProbability": None
    }

for (team, player_id), categories in players.items():

    name = next(
        entry["name"]
        for games in categories.values()
        for entry in games.values()
    )

    summaries = {
        category: summarize(games)
        for category, games in categories.items()
    }

    # Only combine games with recorded observations
    # in BOTH categories. Missing is not assumed zero.
    rushing = categories.get("rushing", {})
    receiving = categories.get("receiving", {})

    shared_games = set(rushing) & set(receiving)

    combined = {
        game: {
            "yards": (
                rushing[game]["yards"] +
                receiving[game]["yards"]
            ),
            "name": name
        }
        for game in shared_games
    }

    if combined:
        summaries["combinedRushingReceiving"] = (
            summarize(combined)
        )

    results.append({
        "team": team,
        "playerId": player_id,
        "name": name,
        "categories": summaries
    })

results.sort(
    key=lambda p: (p["team"], p["name"])
)

output = {
    "season": SEASON,
    "updated": datetime.now(
        timezone.utc
    ).isoformat(),
    "source": "NFL player game logs",
    "note": (
        "Descriptive statistics only. "
        "Missing games are not assumed to be zero. "
        "Combined yards include only games with "
        "observations in both categories. "
        "No projected probabilities are published "
        "until participation and model validation "
        "requirements are satisfied."
    ),
    "players": results
}

destination.write_text(
    json.dumps(output, indent=2),
    encoding="utf-8"
)

print("Players processed:", len(results))
print("Saved:", destination)
