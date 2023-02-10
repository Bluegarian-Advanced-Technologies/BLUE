import { ClientEvents, Guild } from "discord.js";
import Client from "./classes/Client";
import Event from "./classes/Event";

import { recursivelyGetFiles, importDefault } from "./utilities";

const loadCommand = async <T extends keyof ClientEvents>(client: Client, path: string) => {
  const event = (await importDefault(path)) as Event<T>;
  const handler = async (...eventData: ClientEvents[T]) => {
    const guildIdDescriptor = Object.getOwnPropertyDescriptor(eventData[0], "guildId");
    const guildId = guildIdDescriptor && typeof guildIdDescriptor.value === "string" ? guildIdDescriptor.value : undefined;
    
    const guildDisabledEvents = client.bach.disabledEvents.getAll().find((doc) => doc.guildId === guildId);
    if (guildDisabledEvents && (guildDisabledEvents.events as string[]).includes(event.id.toLowerCase())) return;

    try {
      await event.execute(client, ...eventData);
    } catch (e) {
      console.error(e);
    }
  };
  if (event.once) {
    client.once(event.eventType, handler);
  } else {
    client.on(event.eventType, handler);
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
