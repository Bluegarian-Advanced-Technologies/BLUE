const config = require("./config.json");
const utils = require("./utils.js");

async function initialize(client, eventsDir) {
  const events = utils.getAllFiles(eventsDir || "./events").filter((file) => file.endsWith(".js"));

  for (let i = 0; i < events.length; i++) {
    const event = require(events[i]);
    try {
      let on = "on";
      if (event.once) on = "once";

      client[on](event.eventType, (eventData) => {
        try {
          event.execute(eventData, { client });
        } catch (err) {
          console.error(err);
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = { initialize };
