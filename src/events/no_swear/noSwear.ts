import Event from "../../classes/Event";

import { checkSwearWord } from "../../calculateSwear";

export default new Event({
  id: "noSwear",
  once: false,
  eventType: "messageCreate",
}, async (client, message) => {
  if (message.author.bot) return;

  // await checkSwearWord(message);
});
