// ============================================================
// DOC'S NFL WAR ROOM
// KAMBI PLAYER PROPS COLLECTOR
//
// VERIFIED ARCHITECTURE:
// 1. Discover NFL games automatically from Kambi matches.json
// 2. Read each game's exact Kambi event ID
// 3. Fetch that event's player_props
// 4. Fetch that event's betOffers
// 5. Join using exact market_id + outcome_id
// 6. Preserve Kambi's American odds
//
// IMPORTANT:
// - No hard-coded NFL event ID
// - No guessed market/outcome matching
// - Locked/unavailable ladder rungs are not fabricated
// - CBS and Kalshi are completely separate
// ============================================================

const fs = require("fs");
const path = require("path");


// ============================================================
// CONFIGURATION
// ============================================================

const OFFERING = "pivusmsrl-bil";
const MARKET = "US-MS";
const LANGUAGE = "en_US";

const PLAYER_PROPS_BASE =
  "https://offering.sbo.fra-hub.workload.shapegamescloud.com";

const KAMBI_OFFERING_BASE =
  "https://eu.offering-api.kambicdn.com/offering/v2018";

const NFL_MATCHES_URL =
  `${KAMBI_OFFERING_BASE}` +
  `/${OFFERING}` +
  `/listView/american_football/nfl/all/all/matches.json` +
  `?lang=${LANGUAGE}` +
  `&market=${MARKET}` +
  `&client_id=200` +
  `&channel_id=7` +
  `&useCombined=true` +
  `&useCombinedLive=true`;

const OUTPUT_FILE =
  path.join(
    process.cwd(),
    "data",
    "kambi-player-props-2026.json"
  );


// ============================================================
// FETCH JSON
// ============================================================

async function fetchJson(
  name,
  url,
  allowUnavailable = false
) {

  console.log("");
  console.log(
    "========================================"
  );
  console.log(name);
  console.log(
    "========================================"
  );
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

    if (allowUnavailable) {

      console.log(
        `${name} unavailable. Skipping event.`
      );

      return null;
    }

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
// GENERIC OBJECT WALKER
// ============================================================

function walk(
  value,
  callback
) {

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
    const item of
    Object.values(value)
  ) {
    walk(item, callback);
  }
}


// ============================================================
// DISCOVER NFL EVENTS
// ============================================================

function discoverEvents(
  matchesData
) {

  const discovered =
    new Map();

  const eventWrappers =
    Array.isArray(
      matchesData?.events
    )
      ? matchesData.events
      : [];

  for (
    const wrapper of
    eventWrappers
  ) {

    const event =
      wrapper?.event;

    if (!event) {
      continue;
    }

    const id =
      event.id;

    const name =
      String(
        event.name ?? ""
      ).trim();

    if (
      id === undefined ||
      id === null ||
      !name
    ) {
      continue;
    }

    const idString =
      String(id);

    if (
      !discovered.has(
        idString
      )
    ) {

      discovered.set(
        idString,
        {
          id: idString,
          name,
          start:
            event.start ??
            event.startTime ??
            event.startDate ??
            "",
          state:
            event.state ??
            event.status ??
            "",
          live:
            event.live ??
            false
        }
      );
    }
  }

  return Array.from(
    discovered.values()
  );
}


// ============================================================
// PLAYER PROP CATEGORY HELPERS
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


function findPlayerOfferingBlocks(
  category
) {

  const blocks = [];

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

        blocks.push(
          object
        );
      }
    }
  );

  return blocks;
}


// ============================================================
// BUILD EXACT KAMBI ID MAPS
// ============================================================

function buildOfferMaps(
  eventData
) {

  const marketMap =
    new Map();

  const outcomeMap =
    new Map();

  const betOffers =
    Array.isArray(
      eventData?.betOffers
    )
      ? eventData.betOffers
      : [];

  for (
    const offer of
    betOffers
  ) {

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
      Array.isArray(
        offer?.outcomes
      )
        ? offer.outcomes
        : [];

    for (
      const outcome of
      outcomes
    ) {

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
// MARKET LABEL HELPERS
// ============================================================

function getMarketLabel(
  offer
) {

  return String(
    offer?.criterion?.label ??
    offer?.criterion?.englishLabel ??
    offer?.criterion?.shortLabel ??
    offer?.criterion?.shortEnglishLabel ??
    ""
  ).trim();
}


function getShortMarketLabel(
  offer
) {

  return String(
    offer?.criterion?.shortLabel ??
    offer?.criterion?.shortEnglishLabel ??
    offer?.criterion?.label ??
    offer?.criterion?.englishLabel ??
    ""
  ).trim();
}


// ============================================================
// EXTRACT MILESTONE
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
    .map(
      value =>
        String(value).trim()
    );

  for (
    const label of labels
  ) {

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
    String(
      fallbackLabel
    ).trim()
  ) {

    return String(
      fallbackLabel
    ).trim();
  }

  return "";
}


// ============================================================
// DISPLAY MARKET
// ============================================================

function getDisplayMarket(
  offer,
  outcome,
  fallbackLabel
) {

  const shortLabel =
    getShortMarketLabel(
      offer
    );

  if (shortLabel) {
    return shortLabel;
  }

  const fullLabel =
    getMarketLabel(
      offer
    );

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

  if (outcome?.label) {

    return String(
      outcome.label
    ).trim();
  }

  return "";
}


// ============================================================
// CREATE ONE EXACT PROP RECORD
// ============================================================

function makePropRecord({
  eventId,
  eventName,
  eventStart,
  categoryName,
  player,
  fallbackMilestone,
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
      reference.market_id ??
      ""
    );

  const outcomeId =
    String(
      reference.outcome_id ??
      ""
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
      eventStart,
      category:
        categoryName,
      player:
        player.player_name ??
        "",
      playerParticipantId:
        player.player_participant_id ??
        "",
      teamParticipantId:
        player.team_participant_id ??
        "",
      milestone:
        fallbackMilestone ??
        "",
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
    eventStart,

    category:
      categoryName,

    player:
      player.player_name ??
      "",

    playerParticipantId:
      player.player_participant_id ??
      "",

    teamParticipantId:
      player.team_participant_id ??
      "",

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
      getMarketLabel(
        offer
      ),

    shortMarketLabel:
      getShortMarketLabel(
        offer
      ),

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
// PARSE ONE EVENT'S PLAYER PROPS
// ============================================================

function parsePlayerProps(
  propsData,
  eventData,
  discoveredEvent
) {

  const {
    marketMap,
    outcomeMap
  } =
    buildOfferMaps(
      eventData
    );

  const categories =
    Array.isArray(
      propsData?.player_props
    )
      ? propsData.player_props
      : [];

  const records = [];

  for (
    const category of
    categories
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
      const block of
      blocks
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
        const player of
        players
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
                  discoveredEvent.id,

                eventName:
                  discoveredEvent.name,

                eventStart:
                  discoveredEvent.start,

                categoryName,

                player,

                fallbackMilestone:
                  labels[index] ??
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
// COLLECT ONE NFL EVENT
// ============================================================

async function collectEvent(
  event
) {

  console.log("");
  console.log("");
  console.log(
    "########################################"
  );
  console.log(
    `GAME: ${event.name}`
  );
  console.log(
    `EVENT ID: ${event.id}`
  );
  console.log(
    "########################################"
  );

  const playerPropsUrl =
    `${PLAYER_PROPS_BASE}` +
    `/${OFFERING}` +
    `/api/events/${event.id}` +
    `/player_props` +
    `?market=${MARKET}` +
    `&lang=${LANGUAGE}`;

  const eventUrl =
    `${KAMBI_OFFERING_BASE}` +
    `/${OFFERING}` +
    `/betoffer/event/${event.id}.json` +
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
        playerPropsUrl,
        true
      ),

      fetchJson(
        "BET OFFERS",
        eventUrl,
        true
      )
    ]);

  if (
    !propsData ||
    !eventData
  ) {

    console.log(
      `Skipping ${event.name}: required data unavailable.`
    );

    return {
      event,
      props: [],
      skipped: true,
      reason:
        "Player props or bet offers unavailable"
    };
  }

  const props =
    parsePlayerProps(
      propsData,
      eventData,
      event
    );

  const exactMatches =
    props.filter(
      prop =>
        prop.resolution ===
        "EXACT_ID_MATCH"
    ).length;

  const unresolved =
    props.length -
    exactMatches;

  console.log("");
  console.log(
    "Referenced props:",
    props.length
  );

  console.log(
    "Exact ID matches:",
    exactMatches
  );

  console.log(
    "Unresolved:",
    unresolved
  );

  return {
    event,
    props,
    skipped: false,
    counts: {
      referencedProps:
        props.length,
      exactMatches,
      unresolved
    }
  };
}


// ============================================================
// MAIN
// ============================================================

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "DOC'S KAMBI NFL PLAYER PROPS COLLECTOR"
  );

  console.log(
    "========================================"
  );


  // ----------------------------------------------------------
  // STEP 1:
  // AUTOMATICALLY DISCOVER NFL EVENT IDS
  // ----------------------------------------------------------

  const matchesData =
    await fetchJson(
      "NFL MATCHES",
      NFL_MATCHES_URL
    );

  const events =
    discoverEvents(
      matchesData
    );

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "NFL EVENTS DISCOVERED"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Count:",
    events.length
  );

  for (
    const event of events
  ) {

    console.log(
      `${event.id} | ${event.name}`
    );
  }


  if (
    events.length === 0
  ) {

    throw new Error(
      "No NFL events were discovered from Kambi."
    );
  }


  // ----------------------------------------------------------
  // STEP 2:
  // COLLECT PLAYER PROPS FOR EACH EVENT
  // ----------------------------------------------------------

  const eventResults = [];

  for (
    const event of events
  ) {

    try {

      const result =
        await collectEvent(
          event
        );

      eventResults.push(
        result
      );

    } catch (error) {

      console.error("");
      console.error(
        `EVENT FAILED: ${event.name}`
      );

      console.error(
        error.message
      );

      eventResults.push({
        event,
        props: [],
        skipped: true,
        reason:
          error.message
      });
    }
  }


  // ----------------------------------------------------------
  // STEP 3:
  // COMBINE ALL EXACT EVENT DATA
  // ----------------------------------------------------------

  const allProps =
    eventResults.flatMap(
      result =>
        result.props
    );


  const resolved =
    allProps.filter(
      prop =>
        prop.resolution ===
        "EXACT_ID_MATCH"
    );


  const unresolved =
    allProps.filter(
      prop =>
        prop.resolution !==
        "EXACT_ID_MATCH"
    );


  // ----------------------------------------------------------
  // SORT FOR CLEAN OUTPUT
  // ----------------------------------------------------------

  allProps.sort(
    (a, b) =>

      String(
        a.eventName
      ).localeCompare(
        String(
          b.eventName
        )
      ) ||

      String(
        a.category
      ).localeCompare(
        String(
          b.category
        )
      ) ||

      String(
        a.player
      ).localeCompare(
        String(
          b.player
        )
      ) ||

      String(
        a.displayMarket
      ).localeCompare(
        String(
          b.displayMarket
        )
      )
  );


  // ----------------------------------------------------------
  // EVENT SUMMARY
  // ----------------------------------------------------------

  const eventSummary =
    eventResults.map(
      result => ({
        id:
          result.event.id,

        name:
          result.event.name,

        start:
          result.event.start,

        skipped:
          result.skipped,

        reason:
          result.reason ??
          "",

        referencedProps:
          result.counts
            ?.referencedProps ??
          0,

        exactMatches:
          result.counts
            ?.exactMatches ??
          0,

        unresolved:
          result.counts
            ?.unresolved ??
          0
      })
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
      new Date()
        .toISOString(),

    discovery: {
      sport:
        "american_football",
      league:
        "nfl",
      method:
        "Kambi NFL matches.json",
      hardCodedEventId:
        false,
      eventsDiscovered:
        events.length
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
      eventsDiscovered:
        events.length,

      eventsProcessed:
        eventResults.filter(
          result =>
            !result.skipped
        ).length,

      eventsSkipped:
        eventResults.filter(
          result =>
            result.skipped
        ).length,

      referencedProps:
        allProps.length,

      exactMatches:
        resolved.length,

      unresolved:
        unresolved.length
    },

    events:
      eventSummary,

    props:
      allProps
  };


  // ----------------------------------------------------------
  // SAVE FILE
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


  // ----------------------------------------------------------
  // FINAL CONSOLE REPORT
  // ----------------------------------------------------------

  console.log("");
  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "FINAL KAMBI NFL REPORT"
  );

  console.log(
    "========================================"
  );

  console.log(
    "NFL events discovered:",
    events.length
  );

  console.log(
    "Events processed:",
    output.counts
      .eventsProcessed
  );

  console.log(
    "Events skipped:",
    output.counts
      .eventsSkipped
  );

  console.log(
    "Referenced props:",
    allProps.length
  );

  console.log(
    "Exact ID matches:",
    resolved.length
  );

  console.log(
    "Unresolved:",
    unresolved.length
  );

  console.log("");
  console.log(
    "Saved:",
    OUTPUT_FILE
  );

  console.log("");
  console.log(
    "Collector finished successfully."
  );
}


// ============================================================
// RUN
// ============================================================

main()
  .catch(
    error => {

      console.error("");
      console.error(
        "KAMBI COLLECTOR FAILED"
      );

      console.error(
        error
      );

      process.exit(1);
    }
  );
