import Event from "../../classes/Event";

import { checkSwearWord } from "../../calculateSwear";

export default new Event({
  id: "noSwearEdit",
  once: false,
  eventType: "messageUpdate",
}, async (client, message) => {
  if (message.author?.bot) return;

  if (message.partial) {
    message = await message.fetch();
  }

  await checkSwearWord(message);
});
