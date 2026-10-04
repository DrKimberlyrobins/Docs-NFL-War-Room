// ============================================================
// DOC'S NFL WAR ROOM
// KAMBI PLAYER PROPS COLLECTOR
//
// VERIFIED:
// - Player Props endpoint works
// - Bet Offers endpoint works
// - Exact market_id/outcome_id joining works
// - 617/617 exact matches in first test
// - American odds verified against live Kambi board
//
// THIS VERSION:
// Adds exact market / milestone labels from the bet offer
// itself, while preserving locked/unavailable ladder rungs.
// ============================================================

const fs = require("fs");
const path = require("path");


// ============================================================
// SETTINGS
// ============================================================

const OFFERING = "pivusmsrl-bil";
const MARKET = "US-MS";
const LANGUAGE = "en_US";

const EVENT_ID = "1028812630";


// ============================================================
// VERIFIED ENDPOINTS
// ============================================================

const PLAYER_PROPS_BASE =
  "https://offering.sbo.fra-hub.workload.shapegamescloud.com";

const KAMBI_OFFERING_BASE =
  "https://eu.offering-api.kambicdn.com/offering/v2018";


// ============================================================
// OUTPUT
// ============================================================

const OUTPUT_FILE =
  path.join(
    process.cwd(),
    "data",
    "kambi-player-props-2026.json"
  );


// ============================================================
// FETCH
// ============================================================

async function fetchJson(name, url) {

  console.log("");
  console.log("========================================");
  console.log(name);
  console.log("========================================");
  console.log(url);

  const response =
    await fetch(
      url,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

  console.log(
    "Status:",
    response.status
  );

  if (!response.ok) {

    const body =
      await response.text();

    throw new Error(
      `${name} failed: ${response.status}\n` +
      body.slice(0, 1000)
    );
  }

  const data =
    await response.json();

  console.log(
    `${name} JSON received.`
  );

  return data;
}


// ============================================================
// WALK NESTED DATA
// ============================================================

function walk(value, callback) {

  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return;
  }

  callback(value);

  if (Array.isArray(value)) {

    for (const item of value) {
      walk(item, callback);
    }

    return;
  }

  for (
    const item
    of Object.values(value)
  ) {
    walk(item, callback);
  }
}


// ============================================================
// CATEGORY NAME
// ============================================================

function findCategoryName(category) {

  let name = "";

  walk(
    category,
    object => {

      if (name) {
        return;
      }

      if (
        object.type === "offering_name_header" &&
        object.name
      ) {

        name =
          String(object.name).trim();
      }
    }
  );

  return name;
}


// ============================================================
// PLAYER OFFERING BLOCKS
// ============================================================

function findPlayerOfferingBlocks(category) {

  const blocks = [];

  walk(
    category,
    object => {

      if (
        object.type === "player_offering" &&
        Array.isArray(
          object.player_offerings
        )
      ) {

        blocks.push(object);
      }
    }
  );

  return blocks;
}


// ============================================================
// OFFER MAPS
// ============================================================

function buildOfferMaps(eventData) {

  const marketMap = new Map();
  const outcomeMap = new Map();

  const betOffers =
    Array.isArray(eventData.betOffers)
      ? eventData.betOffers
      : [];

  for (const offer of betOffers) {

    if (
      offer?.id !== undefined &&
      offer?.id !== null
    ) {

      marketMap.set(
        String(offer.id),
        offer
      );
    }

    const outcomes =
      Array.isArray(offer?.outcomes)
        ? offer.outcomes
        : [];

    for (const outcome of outcomes) {

      if (
        outcome?.id === undefined ||
        outcome?.id === null
      ) {
        continue;
      }

      outcomeMap.set(
        String(outcome.id),
        {
          offer,
          outcome
        }
      );
    }
  }

  return {
    marketMap,
    outcomeMap
  };
}


// ============================================================
// CLEAN MARKET LABEL
// ============================================================

function getMarketLabel(offer) {

  return String(
    offer?.criterion?.label ??
    offer?.criterion?.englishLabel ??
    offer?.criterion?.shortLabel ??
    offer?.criterion?.shortEnglishLabel ??
    ""
  ).trim();
}


// ============================================================
// SHORT MARKET LABEL
// ============================================================

function getShortMarketLabel(offer) {

  return String(
    offer?.criterion?.shortLabel ??
    offer?.criterion?.shortEnglishLabel ??
    offer?.criterion?.label ??
    offer?.criterion?.englishLabel ??
    ""
  ).trim();
}


// ============================================================
// EXTRACT LADDER THRESHOLD
//
// Examples:
//
// "150+ Passing Yards By The Player - Including Overtime"
//      -> 150+
//
// "Player 150+ Passing Yards + OT"
//      -> 150+
//
// If the market is not a ladder market, this returns "".
// ============================================================

function extractMilestone(
  offer,
  fallbackLabel = ""
) {

  const labels = [
    offer?.criterion?.label,
    offer?.criterion?.englishLabel,
    offer?.criterion?.shortLabel,
    offer?.criterion?.shortEnglishLabel
  ]
    .filter(Boolean)
    .map(value =>
      String(value).trim()
    );


  for (const label of labels) {

    const match =
      label.match(
        /(?:^|\s)(\d+(?:\.\d+)?\+)(?:\s|$)/
      );

    if (match) {
      return match[1];
    }
  }


  if (
    fallbackLabel &&
    String(fallbackLabel)
      .trim()
  ) {

    return String(
      fallbackLabel
    ).trim();
  }


  return "";
}


// ============================================================
// MARKET DESCRIPTION
//
// Gives us a human-readable description such as:
//
// 150+ Passing Yards
// 200+ Passing Yards
// Over 46.5 Passing Yards
//
// We preserve Kambi's own wording rather than inventing one.
// ============================================================

function getDisplayMarket(
  offer,
  outcome,
  fallbackLabel
) {

  const shortLabel =
    getShortMarketLabel(offer);

  if (shortLabel) {
    return shortLabel;
  }


  const fullLabel =
    getMarketLabel(offer);

  if (fullLabel) {
    return fullLabel;
  }


  const milestone =
    extractMilestone(
      offer,
      fallbackLabel
    );


  if (milestone) {
    return milestone;
  }


  if (
    outcome?.label
  ) {
    return String(
      outcome.label
    ).trim();
  }


  return "";
}


// ============================================================
// ONE PROP RECORD
// ============================================================

function makePropRecord({
  eventId,
  eventName,
  categoryName,
  player,
  fallbackMilestone,
  reference,
  marketMap,
  outcomeMap
}) {

  // Locked/unavailable Kambi ladder positions can contain
  // empty references. We do not invent an outcome for them.

  if (
    !reference ||
    reference.type !== "outcome_reference"
  ) {
    return null;
  }


  const marketId =
    String(
      reference.market_id ?? ""
    );


  const outcomeId =
    String(
      reference.outcome_id ?? ""
    );


  if (
    !marketId ||
    !outcomeId
  ) {
    return null;
  }


  const offer =
    marketMap.get(marketId);


  const outcomeLookup =
    outcomeMap.get(outcomeId);


  const outcome =
    outcomeLookup?.outcome ??
    null;


  const exactMatch =
    Boolean(
      offer &&
      outcome &&
      String(
        outcome.betOfferId ??
        offer.id
      ) === marketId
    );


  if (!exactMatch) {

    return {
      eventId,
      eventName,

      category:
        categoryName,

      player:
        player.player_name ?? "",

      playerParticipantId:
        player.player_participant_id ?? "",

      teamParticipantId:
        player.team_participant_id ?? "",

      milestone:
        fallbackMilestone ?? "",

      displayMarket: "",

      marketId,
      outcomeId,

      marketLabel: "",
      shortMarketLabel: "",

      participant: "",
      participantId: "",

      americanOdds: "",
      rawOdds: "",
      line: "",

      outcomeLabel: "",
      outcomeType: "",

      status:
        "UNRESOLVED",

      resolution:
        "Exact market/outcome ID match not found"
    };
  }


  const milestone =
    extractMilestone(
      offer,
      fallbackMilestone
    );


  return {
    eventId,
    eventName,

    category:
      categoryName,

    player:
      player.player_name ?? "",

    playerParticipantId:
      player.player_participant_id ?? "",

    teamParticipantId:
      player.team_participant_id ?? "",

    milestone,

    displayMarket:
      getDisplayMarket(
        offer,
        outcome,
        fallbackMilestone
      ),

    marketId,
    outcomeId,

    marketLabel:
      getMarketLabel(offer),

    shortMarketLabel:
      getShortMarketLabel(offer),

    betOfferType:
      offer.betOfferType?.name ??
      "",

    participant:
      outcome.participant ??
      "",

    participantId:
      outcome.participantId ??
      "",

    americanOdds:
      outcome.oddsAmerican ??
      "",

    rawOdds:
      outcome.odds ??
      "",

    line:
      outcome.line ??
      "",

    outcomeLabel:
      outcome.label ??
      "",

    outcomeType:
      outcome.type ??
      "",

    status:
      outcome.status ??
      "",

    cashOutStatus:
      outcome.cashOutStatus ??
      "",

    resolution:
      "EXACT_ID_MATCH"
  };
}


// ============================================================
// PARSE PLAYER PROPS
// ============================================================

function parsePlayerProps(
  propsData,
  eventData
) {

  const event =
    Array.isArray(eventData.events)
      ? eventData.events[0]
      : null;


  const eventName =
    event?.name ?? "";


  const {
    marketMap,
    outcomeMap
  } =
    buildOfferMaps(
      eventData
    );


  const categories =
    Array.isArray(
      propsData.player_props
    )
      ? propsData.player_props
      : [];


  const records = [];


  for (
    const category
    of categories
  ) {

    const categoryName =
      findCategoryName(
        category
      );


    const blocks =
      findPlayerOfferingBlocks(
        category
      );


    for (
      const block
      of blocks
    ) {

      const labels =
        Array.isArray(
          block.header
            ?.offering_labels
        )
          ? block.header
              .offering_labels
          : [];


      const players =
        Array.isArray(
          block.player_offerings
        )
          ? block.player_offerings
          : [];


      for (
        const player
        of players
      ) {

        const references =
          Array.isArray(
            player.outcome_references
          )
            ? player
                .outcome_references
            : [];


        references.forEach(
          (
            reference,
            index
          ) => {

            const record =
              makePropRecord({
                eventId:
                  EVENT_ID,

                eventName,

                categoryName,

                player,

                fallbackMilestone:
                  labels[index] ?? "",

                reference,

                marketMap,

                outcomeMap
              });


            if (record) {
              records.push(record);
            }
          }
        );
      }
    }
  }


  return records;
}


// ============================================================
// MAIN
// ============================================================

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "DOC'S KAMBI PLAYER PROPS COLLECTOR"
  );

  console.log(
    "========================================"
  );


  const playerPropsUrl =
    `${PLAYER_PROPS_BASE}` +
    `/${OFFERING}` +
    `/api/events/${EVENT_ID}` +
    `/player_props` +
    `?market=${MARKET}` +
    `&lang=${LANGUAGE}`;


  const eventUrl =
    `${KAMBI_OFFERING_BASE}` +
    `/${OFFERING}` +
    `/betoffer/event/${EVENT_ID}.json` +
    `?lang=${LANGUAGE}` +
    `&market=${MARKET}` +
    `&client_id=200` +
    `&channel_id=7` +
    `&includeParticipants=true`;


  const [
    propsData,
    eventData
  ] =
    await Promise.all([
      fetchJson(
        "PLAYER PROPS",
        playerPropsUrl
      ),

      fetchJson(
        "BET OFFERS",
        eventUrl
      )
    ]);


  const categoryCount =
    Array.isArray(
      propsData.player_props
    )
      ? propsData
          .player_props
          .length
      : 0;


  const betOfferCount =
    Array.isArray(
      eventData.betOffers
    )
      ? eventData
          .betOffers
          .length
      : 0;


  const props =
    parsePlayerProps(
      propsData,
      eventData
    );


  const resolved =
    props.filter(
      prop =>
        prop.resolution ===
        "EXACT_ID_MATCH"
    );


  const unresolved =
    props.filter(
      prop =>
        prop.resolution !==
        "EXACT_ID_MATCH"
    );


  console.log("");
  console.log(
    "Player prop categories:",
    categoryCount
  );

  console.log(
    "Event bet offers:",
    betOfferCount
  );

  console.log(
    "Total referenced props:",
    props.length
  );

  console.log(
    "Exact ID matches:",
    resolved.length
  );

  console.log(
    "Unresolved:",
    unresolved.length
  );


  props.sort(
    (a, b) =>
      String(a.category)
        .localeCompare(
          String(b.category)
        ) ||

      String(a.player)
        .localeCompare(
          String(b.player)
        ) ||

      String(a.displayMarket)
        .localeCompare(
          String(b.displayMarket)
        )
  );


  const output = {

    source:
      "Kambi",

    offering:
      OFFERING,

    market:
      MARKET,

    collectedAt:
      new Date()
        .toISOString(),

    event: {
      id:
        EVENT_ID,

      name:
        Array.isArray(
          eventData.events
        )
          ? eventData
              .events[0]
              ?.name ?? ""
          : ""
    },

    verification: {
      playerPropsEndpoint:
        "Shape Games/Kambi",

      betOffersEndpoint:
        "Kambi Offering API",

      joinMethod:
        "Exact market_id + outcome_id",

      usesAmericanOddsFromSource:
        true,

      lockedMarkets:
        "Skipped when Kambi provides no outcome_reference"
    },

    counts: {
      categories:
        categoryCount,

      betOffers:
        betOfferCount,

      referencedProps:
        props.length,

      exactMatches:
        resolved.length,

      unresolved:
        unresolved.length
    },

    props
  };


  fs.mkdirSync(
    path.dirname(
      OUTPUT_FILE
    ),
    {
      recursive: true
    }
  );


  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      output,
      null,
      2
    )
  );


  console.log("");
  console.log(
    "Saved:",
    OUTPUT_FILE
  );


  // ==========================================================
  // KYLER MURRAY PASSING-YARD SPOT CHECK
  // ==========================================================

  const kylerPassing =
    resolved.filter(
      prop =>
        String(prop.player)
          .toLowerCase() ===
          "kyler murray" &&

        (
          String(
            prop.marketLabel
          )
            .toLowerCase()
            .includes(
              "passing yard"
            ) ||

          String(
            prop.shortMarketLabel
          )
            .toLowerCase()
            .includes(
              "passing yard"
            )
        )
    );


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "KYLER MURRAY PASSING YARDS"
  );

  console.log(
    "========================================"
  );


  if (
    kylerPassing.length === 0
  ) {

    console.log(
      "No Kyler Murray passing-yard props found."
    );

  } else {

    kylerPassing
      .sort(
        (a, b) => {

          const aNumber =
            parseFloat(
              a.milestone
            ) || 0;

          const bNumber =
            parseFloat(
              b.milestone
            ) || 0;

          return (
            aNumber -
            bNumber
          );
        }
      )
      .forEach(prop => {

        console.log(
          [
            prop.player,
            prop.displayMarket,
            prop.milestone,
            prop.americanOdds,
            prop.status,
            prop.marketId,
            prop.outcomeId
          ].join(" | ")
        );
      });
  }


  console.log("");
  console.log(
    "Collector finished successfully."
  );
}


// ============================================================
// RUN
// ============================================================

main()
  .catch(error => {

    console.error("");
    console.error(
      "KAMBI COLLECTOR FAILED"
    );

    console.error(
      error
    );

    process.exit(1);
  });
