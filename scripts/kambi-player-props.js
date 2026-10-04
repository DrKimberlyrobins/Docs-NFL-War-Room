// ============================================================
// DOC'S NFL WAR ROOM
// KAMBI PLAYER PROPS COLLECTOR
//
// TEST PHASE
//
// Uses the exact Kambi endpoint structures verified
// in the browser.
//
// IMPORTANT:
// This file is completely separate from:
// - CBS Sports collector
// - Kalshi collector
// - War Room display
// ============================================================

const fs = require("fs");
const path = require("path");


// ============================================================
// SETTINGS
// ============================================================

const OFFERING = "pivusmsrl-bil";
const MARKET = "US-MS";
const LANGUAGE = "en_US";


// ============================================================
// TEST EVENT
//
// We are intentionally testing the same event we inspected
// manually before attempting automatic event discovery.
// ============================================================

const EVENT_ID = "1028812630";


// ============================================================
// VERIFIED ENDPOINT BASES
// ============================================================

// Player-prop structure
const PLAYER_PROPS_BASE =
  "https://offering.sbo.fra-hub.workload.shapegamescloud.com";

// Bet offers / prices
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
// FETCH JSON
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
// RECURSIVE WALKER
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

  let categoryName = "";

  walk(
    category,
    object => {

      if (categoryName) {
        return;
      }

      if (
        object.type === "offering_name_header" &&
        object.name
      ) {

        categoryName =
          String(object.name).trim();
      }
    }
  );

  return categoryName;
}


// ============================================================
// FIND PLAYER OFFERING BLOCKS
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
// BUILD EXACT KAMBI LOOKUPS
//
// We use exact IDs.
//
// market_id  -> betOffer.id
// outcome_id -> outcome.id
//
// No array-position guessing.
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
// NORMALIZE ONE PROP
// ============================================================

function makePropRecord({
  eventId,
  eventName,
  categoryName,
  player,
  milestone,
  reference,
  marketMap,
  outcomeMap
}) {

  // Kambi sometimes sends an empty reference when
  // a particular milestone is unavailable.

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
    outcomeLookup?.outcome ?? null;


  // ----------------------------------------------------------
  // IMPORTANT VALIDATION
  //
  // Even if the outcome ID exists somewhere else,
  // it must belong to the exact market referenced by
  // player_props.
  // ----------------------------------------------------------

  const exactMatch =
    Boolean(
      offer &&
      outcome &&
      String(
        outcome.betOfferId ?? offer.id
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
        milestone ?? "",

      marketId,
      outcomeId,

      marketLabel: "",

      participant: "",

      participantId: "",

      americanOdds: "",

      rawOdds: "",

      outcomeType: "",

      status:
        "UNRESOLVED",

      resolution:
        "Exact market/outcome ID match not found"
    };
  }


  // ----------------------------------------------------------
  // VERIFIED EXACT MATCH
  // ----------------------------------------------------------

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
      milestone ?? "",

    marketId,
    outcomeId,

    marketLabel:
      offer.criterion?.label ??
      offer.criterion?.englishLabel ??
      "",

    shortMarketLabel:
      offer.criterion?.shortLabel ??
      offer.criterion?.shortEnglishLabel ??
      "",

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
    buildOfferMaps(eventData);

  const categories =
    Array.isArray(
      propsData.player_props
    )
      ? propsData.player_props
      : [];

  const records = [];


  for (const category of categories) {

    const categoryName =
      findCategoryName(category);

    const blocks =
      findPlayerOfferingBlocks(
        category
      );


    for (const block of blocks) {

      const labels =
        Array.isArray(
          block.header?.offering_labels
        )
          ? block.header.offering_labels
          : [];

      const players =
        Array.isArray(
          block.player_offerings
        )
          ? block.player_offerings
          : [];


      for (const player of players) {

        const references =
          Array.isArray(
            player.outcome_references
          )
            ? player.outcome_references
            : [];


        references.forEach(
          (reference, index) => {

            const record =
              makePropRecord({
                eventId:
                  EVENT_ID,

                eventName,

                categoryName,

                player,

                milestone:
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

  console.log(
    "Test Event:",
    EVENT_ID
  );


  // ----------------------------------------------------------
  // EXACT PLAYER-PROPS ENDPOINT STRUCTURE
  // CAPTURED FROM THE KAMBI PAGE
  // ----------------------------------------------------------

  const playerPropsUrl =
    `${PLAYER_PROPS_BASE}` +
    `/${OFFERING}` +
    `/api/events/${EVENT_ID}` +
    `/player_props` +
    `?market=${MARKET}` +
    `&lang=${LANGUAGE}`;


  // ----------------------------------------------------------
  // EXACT BET-OFFER ENDPOINT STRUCTURE
  // CAPTURED FROM THE KAMBI PAGE
  //
  // We intentionally do NOT depend on the ncid value.
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // BASIC SOURCE COUNTS
  // ----------------------------------------------------------

  const categoryCount =
    Array.isArray(
      propsData.player_props
    )
      ? propsData.player_props.length
      : 0;


  const betOfferCount =
    Array.isArray(
      eventData.betOffers
    )
      ? eventData.betOffers.length
      : 0;


  console.log("");
  console.log(
    "Player prop categories:",
    categoryCount
  );

  console.log(
    "Event bet offers:",
    betOfferCount
  );


  // ----------------------------------------------------------
  // PARSE + EXACT-ID JOIN
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // SORT FOR EASY INSPECTION
  // ----------------------------------------------------------

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

      String(a.milestone)
        .localeCompare(
          String(b.milestone)
        )
  );


  // ----------------------------------------------------------
  // FINAL OUTPUT
  // ----------------------------------------------------------

  const output = {

    source:
      "Kambi",

    offering:
      OFFERING,

    market:
      MARKET,

    collectedAt:
      new Date().toISOString(),

    event: {
      id:
        EVENT_ID,

      name:
        Array.isArray(
          eventData.events
        )
          ? eventData.events[0]?.name ?? ""
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
        true
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


  // ----------------------------------------------------------
  // WRITE FILE
  // ----------------------------------------------------------

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
    "Saved:"
  );

  console.log(
    OUTPUT_FILE
  );


  // ----------------------------------------------------------
  // SHOW VERIFIED SAMPLES IN ACTION LOG
  // ----------------------------------------------------------

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "SAMPLE EXACT MATCHES"
  );

  console.log(
    "========================================"
  );


  resolved
    .slice(0, 15)
    .forEach(prop => {

      console.log(
        [
          prop.player,
          prop.category,
          prop.milestone,
          prop.americanOdds,
          prop.status
        ].join(" | ")
      );
    });


  // ----------------------------------------------------------
  // SPECIFIC KYLER CHECK
  //
  // This gives us an easy way to verify the exact player
  // we manually inspected in DevTools.
  // ----------------------------------------------------------

  const kyler =
    resolved.filter(
      prop =>
        String(prop.player)
          .toLowerCase()
          .includes(
            "kyler murray"
          )
    );


  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "KYLER MURRAY CHECK"
  );

  console.log(
    "========================================"
  );


  if (kyler.length === 0) {

    console.log(
      "No resolved Kyler Murray props found."
    );

  } else {

    kyler.forEach(prop => {

      console.log(
        [
          prop.category,
          prop.milestone,
          prop.marketId,
          prop.outcomeId,
          prop.americanOdds,
          prop.status
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
