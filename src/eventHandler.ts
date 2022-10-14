import { ClientEvents } from "discord.js";
import Client from "./classes/Client";
import Event from "./classes/Event";

import { recursivelyGetFiles, importDefault } from "./utilities";

const loadCommand = async<T extends keyof ClientEvents>(client: Client, path: string) => {
  const event = await importDefault(path) as Event<T>;
  // FIXME: guild disabled events
  if (event.once) {
    client.once(event.eventType, async (...eventData) => {
      // const guildDisabledEvents = client.bach.disabledEvents.getAll().find((doc) => doc.guildId === eventData?.[0]?.guild?.id);
      // if (guildDisabledEvents && (guildDisabledEvents.events as string[]).includes(event.id)) return;

      try {
        await event.execute(client, ...eventData);
      } catch (e) {
        console.error(e);
      }
    });
  } else {
    client.on(event.eventType, async (...eventData) => {
      // const guildDisabledEvents = client.bach.disabledEvents.getAll().find((doc) => doc.guildId === eventData?.[0]?.guild?.id);
      // if (guildDisabledEvents && (guildDisabledEvents.events as string[]).includes(event.id)) return;

      try {
        await event.execute(client, ...eventData);
      } catch (e) {
        console.error(e);
      }
    });
  }
  return event;
};

const initialize = async (client: Client, eventsDir?: string) => {
  const events = recursivelyGetFiles(eventsDir || "./dist/events").filter((file) => file.endsWith(".js"));

  for (let i = 0; i < events.length; i++) {
    try {
      const event = await loadCommand(client, events[i]);
      
      client.bach.events.set(event.id.toLowerCase(), event);
    } catch (err) {
      console.error(err);
    }
  }
};

export default { initialize };
