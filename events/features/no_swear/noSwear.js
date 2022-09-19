const calculateSwear = require("./calculateSwear");

const localSwearWords = require("./swearWords.json");

module.exports = {
  id: "no_swear",
  once: false,
  eventType: "messageCreate",

  init: async () => {
    await calculateSwear.words.swearWords.init();

    calculateSwear.words.swearWords.updateCache((words) => {
      for (const key in localSwearWords) {
        words.push({
          word: key,
          severity: localSwearWords[key],
        });
      }
    });
  },

  execute: async (event, {}) => {
    if (event.author?.bot) return;

    await calculateSwear.checkSwearWord(event, true);
  },
};
