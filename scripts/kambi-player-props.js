// ============================================================
// DOC'S NFL WAR ROOM
// KAMBI PLAYER PROPS COLLECTOR
//
// PHASE 1:
// 1. Fetch Kambi player-prop structure
// 2. Fetch the event's bet offers
// 3. Join market/outcome IDs
// 4. Produce clean player-prop records
//
// This collector is completely separate from:
// - CBS Sports collector
// - Kalshi collector
// - War Room display
// ============================================================

const fs = require("fs");
const path = require("path");


// ============================================================
// KAMBI SETTINGS
// ============================================================

const OFFERING =
  "pivusmsrl-bil";

const MARKET =
  "US-MS";

const LANGUAGE =
  "en_US";

const API_VERSION =
  "v2018";

const BASE_URL =
  `https://eu-offering-api.kambicdn.com/offering/${API_VERSION}/${OFFERING}`;


// ============================================================
// TEST EVENT
//
// We are deliberately starting with the event we inspected
// manually in Chrome so we can verify the collector against
// known Kambi data before automating NFL event discovery.
// ============================================================

const EVENT_ID =
  "1028812630";


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

async function fetchJson(url) {

  console.log(
    "\nFetching:"
  );

  console.log(url);


  const response =
    await fetch(
      url,
      {
        headers: {
          "Accept":
            "application/json",

          "User-Agent":
            "Mozilla/5.0"
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
      `Kambi request failed: ` +
      `${response.status}\n` +
      body.slice(0, 500)
    );
  }


  return response.json();
}


// ============================================================
// WALK ANY OBJECT
//
// Kambi's player-props response is nested.
// This helper lets us find objects without depending on
// one fragile nesting depth.
// ============================================================

function walk(
  value,
  callback
) {

  if (
    value === null ||
    value === undefined
  ) {
    return;
  }


  if (
    typeof value !== "object"
  ) {
    return;
  }


  callback(value);


  if (Array.isArray(value)) {

    value.forEach(item =>
      walk(
        item,
        callback
      )
    );

    return;
  }


  Object.values(value)
    .forEach(item =>
      walk(
        item,
        callback
      )
    );
}


// ============================================================
// GET MARKET CATEGORY NAME
// ============================================================

function findCategoryName(
  category
) {

  let name = "";


  walk(
    category,
    object => {

      if (name) {
        return;
      }


      if (
        object.type ===
          "offering_name_header" &&
        object.name
      ) {

        name =
          String(
            object.name
          ).trim();
      }
    }
  );


  return name;
}


// ============================================================
// FIND PLAYER OFFERING BLOCKS
// ============================================================

function findPlayerOfferings(
  category
) {

  const offerings = [];


  walk(
    category,
    object => {

      if (
        object.type ===
          "player_offering" &&
        Array.isArray(
          object.player_offerings
        )
      ) {

        offerings.push(
          object
        );
      }
    }
  );


  return offerings;
}


// ============================================================
// CREATE BET OFFER LOOKUPS
// ============================================================

function buildBetOfferMaps(
  eventData
) {

  const marketMap =
    new Map();

  const outcomeMap =
    new Map();


  const offers =
    Array.isArray(
      eventData.betOffers
    )
      ? eventData.betOffers
      : [];


  for (const offer of offers) {

    if (!offer) {
      continue;
    }


    if (
      offer.id !== undefined &&
      offer.id !== null
    ) {

      marketMap.set(
        String(offer.id),
        offer
      );
    }


    const outcomes =
      Array.isArray(
        offer.outcomes
      )
        ? offer.outcomes
        : [];


    for (
      const outcome of outcomes
    ) {

      if (
        outcome?.id ===
          undefined ||
        outcome?.id ===
          null
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
// NORMALIZE ONE PLAYER PROP
// ============================================================

function makePropRecord({
  eventId,
  eventName,
  categoryName,
  player,
  label,
  reference,
  marketMap,
  outcomeMap
}) {

  if (
    !reference ||
    reference.type !==
      "outcome_reference"
  ) {

    return null;
  }


  const marketId =
    String(
      reference.market_id || ""
    );


  const outcomeId =
    String(
      reference.outcome_id || ""
    );


  if (
    !marketId ||
    !outcomeId
  ) {

    return null;
  }


  const offer =
    marketMap.get(
      marketId
    );


  const outcomeLookup =
    outcomeMap.get(
      outcomeId
    );


  const outcome =
    outcomeLookup?.outcome ||
    null;


  /*
    Do not guess if Kambi gave us a reference
    that we cannot resolve.
  */

  if (
    !offer ||
    !outcome
  ) {

    return {
      eventId,
      eventName,

      category:
        categoryName,

      player:
        player.player_name || "",

      playerParticipantId:
        player.player_participant_id || "",

      teamParticipantId:
        player.team_participant_id || "",

      milestone:
        label || "",

      marketId,
      outcomeId,

      marketLabel:
        "",

      americanOdds:
        "",

      decimalOdds:
        "",

      rawOdds:
        "",

      status:
        "UNRESOLVED",

      participant:
        "",

      outcomeType:
        ""
    };
  }


  return {
    eventId,
    eventName,

    category:
      categoryName,

    player:
      player.player_name || "",

    playerParticipantId:
      player.player_participant_id || "",

    teamParticipantId:
      player.team_participant_id || "",

    milestone:
      label || "",

    marketId,
    outcomeId,

    marketLabel:
      offer.criterion?.label ||
      offer.criterion?.englishLabel ||
      "",

    americanOdds:
      outcome.oddsAmerican ||
      "",

    decimalOdds:
      outcome.oddsDecimal ||
      "",

    rawOdds:
      outcome.odds ?? "",

    status:
      outcome.status ||
      "",

    participant:
      outcome.participant ||
      "",

    participantId:
      outcome.participantId ||
      "",

    outcomeType:
      outcome.type ||
      ""
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
    Array.isArray(
      eventData.events
    )
      ? eventData.events[0]
      : null;


  const eventName =
    event?.name || "";


  const {
    marketMap,
    outcomeMap
  } =
    buildBetOfferMaps(
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
      findPlayerOfferings(
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
            player
              .outcome_references
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

                label:
                  labels[index] ||
                  "",

                reference,

                marketMap,

                outcomeMap
              });


            if (record) {

              records.push(
                record
              );
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


  /*
    This is the event-specific player-props
    request we discovered in Chrome.
  */

  const propsUrl =
    `${BASE_URL}` +
    `/event/${EVENT_ID}` +
    `/player_props` +
    `?market=${MARKET}` +
    `&lang=${LANGUAGE}`;


  /*
    This is the event JSON request we verified
    in Chrome. It contains the betOffers and
    outcome prices.
  */

  const eventUrl =
    `${BASE_URL}` +
    `/betoffer/event/${EVENT_ID}.json` +
    `?lang=${LANGUAGE}` +
    `&market=${MARKET}`;


  const [
    propsData,
    eventData
  ] =
    await Promise.all([
      fetchJson(
        propsUrl
      ),

      fetchJson(
        eventUrl
      )
    ]);


  console.log(
    "\nPlayer prop categories:",
    Array.isArray(
      propsData.player_props
    )
      ? propsData
          .player_props
          .length
      : 0
  );


  console.log(
    "Event bet offers:",
    Array.isArray(
      eventData.betOffers
    )
      ? eventData
          .betOffers
          .length
      : 0
  );


  const props =
    parsePlayerProps(
      propsData,
      eventData
    );


  const resolved =
    props.filter(
      prop =>
        prop.status !==
        "UNRESOLVED"
    );


  const unresolved =
    props.filter(
      prop =>
        prop.status ===
        "UNRESOLVED"
    );


  console.log(
    "\nResolved player props:",
    resolved.length
  );


  console.log(
    "Unresolved references:",
    unresolved.length
  );


  /*
    Sort the output so it is easy for us
    to inspect in GitHub.
  */

  props.sort(
    (a, b) => {

      return (
        a.category.localeCompare(
          b.category
        ) ||

        a.player.localeCompare(
          b.player
        ) ||

        a.milestone.localeCompare(
          b.milestone
        )
      );
    }
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
              ?.name || ""
          : ""
    },

    counts: {
      categories:
        Array.isArray(
          propsData.player_props
        )
          ? propsData
              .player_props
              .length
          : 0,

      betOffers:
        Array.isArray(
          eventData.betOffers
        )
          ? eventData
              .betOffers
              .length
          : 0,

      playerProps:
        props.length,

      resolved:
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


  console.log(
    "\nSaved:"
  );

  console.log(
    OUTPUT_FILE
  );


  /*
    Print a few resolved examples so the
    GitHub Action log can be checked without
    opening the entire JSON file.
  */

  console.log(
    "\nSAMPLE RESOLVED PROPS"
  );

  console.log(
    "----------------------------------------"
  );


  resolved
    .slice(0, 10)
    .forEach(prop => {

      console.log(
        `${prop.player} | ` +
        `${prop.category} | ` +
        `${prop.milestone} | ` +
        `${prop.americanOdds}`
      );
    });


  console.log(
    "\nCollector finished."
  );
}


// ============================================================
// RUN
// ============================================================

main()
  .catch(error => {

    console.error(
      "\nKAMBI COLLECTOR FAILED"
    );

    console.error(
      error
    );

    process.exit(1);
  });
