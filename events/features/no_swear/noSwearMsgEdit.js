const calculateSwear = require("./calculateSwear");

module.exports = {
  id: "no_swear_edit",
  once: false,
  eventType: "messageUpdate",

  execute: async (event, {}) => {
    if (event.author?.bot) return;

    await calculateSwear.checkSwearWord(event);
  },
};
