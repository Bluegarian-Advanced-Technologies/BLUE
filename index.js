if (process.env.NODE_ENV !== "production") require("dotenv").config();

const { Client, IntentsBitField } = require("discord.js");
const { ActivityType } = require("discord-api-types/v10");
const mongoose = require("mongoose");

const commandHandler = require("./commandHandler.js");
const eventHandler = require("./eventHandler.js");

const music = require("./music.js");

const config = require("./config.json");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildMembers,
  ],
  presence: {
    activities: [
      {
        name: config.prefix + "help",
        type: ActivityType.Listening,
      },
    ],
  },
});

client.once("ready", async () => {
  const chalk = await import("chalk");
  console.log(
    chalk.default.blue(`
--------------------------------
-- System: BLUE is now online --
--------------------------------`)
  );
});

console.log("Connecting to MongoDB database...");
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on("connected", () => {
  console.log("Connected to MongoDB database");
});
db.on("error", (err) => {
  console.error(err);
});
db.on("disconnected", () => {
  console.log("Disconnected from MongoDB database");
});

(async () => {
  music(client);
  await commandHandler.initialize(client, { prefix: config.prefix });
  await eventHandler.initialize(client);
  await client.login(process.env.TOKEN);
  client.on("raw", (data) => client.audioManager.updateVoiceState(data));
})();
