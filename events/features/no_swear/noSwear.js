const LiveCollection = require("../../../classes/LiveCollection.js");
const swearWord = require("../../../models/swearWord.js");

const swearWords = new LiveCollection(swearWord);

const localSwearWords = require("./swearWords.json");

function shouldRemind(severity = 1) {
  const die = Math.floor(Math.random() * 10);
  return die + severity > 5;
}

module.exports = {
  id: "no_swear",
  once: false,
  eventType: "messageCreate",

  init: async () => {
    await swearWords.init();

    swearWords.updateCache((words) => {
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

    const word = swearWords.getAll().find((word) => event.content.toLowerCase().includes(word.word));
    if (word == null) return;

    if (shouldRemind(word.severity)) {
      const reminder = event.reply({ content: "No swear" });
      setTimeout(async () => {
        try {
          await reminder.delete();
        } catch {}
      }, 4500);
    }
  },
};
