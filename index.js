if (process.env.NODE_ENV !== "production") require("dotenv").config();

console.time("Bot start time");

const { Client, IntentsBitField } = require("discord.js");
const { ActivityType } = require("discord-api-types/v10");
const mongoose = require("mongoose");

const commandHandler = require("./commandHandler.js");
const eventHandler = require("./eventHandler.js");

const config = require("./config.json");

const path = require("path");
const { spawn } = require("child_process");

const lavalinkProcess = config["lavalink-local"]
  ? spawn("java", ["-Xmx400M", "-jar", "Lavalink.jar"], {
      cwd: path.join(__dirname, "./Lavalink"),
    })
  : null;

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
  // Init local lavalink server
  if (config["lavalink-local"]) {
    console.log("Starting local Lavalink process...");
    console.time("Lavalink startup time");
    await new Promise((resolve) => {
      lavalinkProcess.stdout.on("data", (data) => {
        if (data.toString("utf-8").includes("Started Launcher")) return resolve();
      });
    });
    console.timeEnd("Lavalink startup time");
  }

  // Start command handler
  await commandHandler.initialize(client, { prefix: config.prefix });
  await eventHandler.initialize(client);

  // Launch bot
  await client.login(process.env.TOKEN);
  console.timeEnd("Bot start time");

  // Relay voice data to Lavalink server
  client.on("raw", (data) => client.audioManager.updateVoiceState(data));
})();
