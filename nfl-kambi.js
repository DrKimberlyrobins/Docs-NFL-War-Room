// ============================================================
// DOC'S NFL WAR ROOM
// KAMBI PLAYER PROP DATA LOADER
// ============================================================

(() => {
  "use strict";

  const DATA_URL =
    "data/kambi-player-props-2026.json";

  let kambiData = null;

  async function loadKambiData() {
    try {
      const response = await fetch(DATA_URL);

      if (!response.ok) {
        throw new Error(
          `Kambi data failed: ${response.status}`
        );
      }

      kambiData = await response.json();

      console.log(
        "KAMBI DATA LOADED:",
        kambiData.counts
      );

      console.log(
        "KAMBI EVENTS:",
        kambiData.events
      );

    } catch (error) {
      console.error(
        "KAMBI DATA ERROR:",
        error
      );
    }
  }

  loadKambiData();

})();
