import { Message } from "discord.js";

import Perspective from "./perspective";

import LiveCollection from "./classes/LiveCollection";
import swearWords from "./models/swearWords";

import localSwearWords from "./swearWords.json" assert { type: "json" };

const client = new Perspective({ apiKey: process.env.PERSPECTIVE_API_KEY! });
const swearWordsCollection = new LiveCollection(swearWords);

const cooldownUsers: string[] = [];

export const shouldRemind = (severity = 1) => {
  const die = Math.floor(Math.random() * 10);
  return die + severity > 5;
};

export const checkSwearWord = async (event: Message) => {
  const word = swearWordsCollection.getAll().find((word) =>
    event.content
      .toLowerCase()
      .replace(/ |[^a-zA-Z]/g, "")
      .includes(word.word)
  );
  if (word == null) return;

  if (shouldRemind(word.severity) && !cooldownUsers.includes(event.author.id)) {
    const analyzeRequest = {
      comment: {
        text: event.content,
      },
      languages: ["en"],
      requestedAttributes: {
        TOXICITY: {},
      },
    };
    
    const response = await client.analyze(analyzeRequest).catch(error => console.error(error));
    if (response == null) return;

    if (response.attributeScores.TOXICITY!.summaryScore.value < 0.8) return;

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
}

export const initialize = async () => {
  await swearWordsCollection.initialize();

  const all = swearWordsCollection.getAll();
  const local = Object.keys(localSwearWords);
  for (const word of local) {
    if (!all.find((w) => w.word === word)) {
      await swearWordsCollection.set({ 
        word, 
        severity: localSwearWords[word as keyof typeof localSwearWords] 
      });
    }
  }
};
