const config = require("./config.json");
const utils = require("./utils.js");

const { Collection } = require("discord.js");

async function initialize(client, eventsDir) {
  const events = utils.getAllFiles(eventsDir || "./events").filter((file) => file.endsWith(".js"));

  client.BACH.events = new Collection();

  for (let i = 0; i < events.length; i++) {
    const event = require(events[i]);
    try {
      let on = "on";
      if (event.once) on = "once";

      client[on](event.eventType, (eventData) => {
        const guildDisabledEvents = client.BACH.disabledEvents.getAll().find((doc) => doc.guildId === eventData.guildId);
        if (guildDisabledEvents && guildDisabledEvents.events.includes(event.id)) return;

        try {
          event.execute(eventData, { client });
        } catch (err) {
          console.error(err);
        }
      });

      if (event.init) await event.init(client);
      client.BACH.events.set(event.id.toLowerCase(), event);
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = { initialize };
