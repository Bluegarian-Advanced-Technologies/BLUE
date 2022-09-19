const LiveCollection = require("../../../classes/LiveCollection.js");
const swearWord = require("../../../models/swearWord.js");

const swearWords = new LiveCollection(swearWord);

const { google } = require("googleapis");

const cooldownUsers = [];

function shouldRemind(severity = 1) {
  const die = Math.floor(Math.random() * 10);
  return die + severity > 5;
}

async function checkSwearWord(event) {
  const word = swearWords.getAll().find((word) =>
    event.content
      .toLowerCase()
      .replace(/ |[^a-zA-Z]/g, "")
      .includes(word.word)
  );
  if (word == null) return;

  if (shouldRemind(word.severity) && !cooldownUsers.includes(event.author.id)) {
    const client = await google.discoverAPI("https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1");
    const analyzeRequest = {
      comment: {
        text: event.content,
      },
      languages: ["en"],
      requestedAttributes: {
        TOXICITY: {},
      },
    };

    client.comments.analyze(
      {
        key: process.env.PERSPECTIVE_API_KEY,
        resource: analyzeRequest,
      },
      async (err, response) => {
        if (err) console.error(err);

        if (response.data.attributeScores.TOXICITY.summaryScore.value < 0.5) return;

        const reminder = await event.reply({ content: "No swear" });

        cooldownUsers.push(event.author.id);

        setTimeout(async () => {
          try {
            await reminder.delete();
          } catch {}
        }, 4500);

        setTimeout(() => {
          cooldownUsers.splice(
            cooldownUsers.findIndex((id) => id === event.author.id),
            1
          );
        }, 12000);
      }
    );
  }
}

module.exports = {
  notEvent: true,
  words: {
    swearWords,
  },
  shouldRemind,
  checkSwearWord,
};
