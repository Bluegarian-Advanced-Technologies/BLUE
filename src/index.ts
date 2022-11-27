import { Database, Environment } from "@nextium/common";

if (process.env.NODE_ENV !== "production") {
  Environment.load([
    "PERSPECTIVE_API_KEY",
    "BOT_ID", 
    "TOKEN", 
    "MONGODB_URI",
    "LOCAL_LAVALINK", 
    "LAVALINK_PASSWORD", 
    // "SPOTIFY_CLIENT_ID", 
    // "SPOTIFY_CLIENT_SECRET"
  ], true);
}

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import moduleAlias from "module-alias";
moduleAlias.addAlias("erela.js", path.join(__dirname, "../node_modules/@nextium/erela.js"));

console.time("Bot start time");

import { spawn } from "child_process";

import { IntentsBitField } from "discord.js";
import { ActivityType } from "discord-api-types/v10";

// import Filters from "erela.js-filters"
// import Spotify from "erela.js-spotify";

import commandHandler from "./commandHandler";
import eventHandler from "./eventHandler";

import settings from "./settings.json" assert { type: "json" };

import Client from "./classes/Client";

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
        name: settings.prefix + "help",
        type: ActivityType.Listening,
      },
    ],
  },
}, {
  nodes: [
    {
      host: process.env.LOCAL_LAVALINK === "yes" ? "0.0.0.0" : "24.141.115.80",
      port: 2333,
      password: process.env.LAVALINK_PASSWORD,
      secure: false,
    },
  ],
  plugins: [
    // // The unload method is not declared
    // // @ts-expect-error The plugin uses the original erela.js package
    // new Spotify({
    //   clientID: process.env.SPOTIFY_CLIENT_ID as string,
    //   clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
    // }),
    // // @ts-expect-error The plugin uses the original erela.js package
    // new Filters(),
  ],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
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
const uri = process.env.MONGODB_URI as string;
const db = new Database(uri, uri.split("/").pop()?.split("?")[0] as string);

db.on("connected", () => {
  console.log("Connected to MongoDB database");
});
db.on("error", (e) => {
  console.error(e);
});
db.on("disconnected", () => {
  console.log("Disconnected from MongoDB database");
});

await db.connect();

// Init local lavalink server
if (process.env.LOCAL_LAVALINK === "yes") {
  console.log("Starting local Lavalink process...");
  console.time("Lavalink startup time");

  const lavalinkProcess = spawn("C:\\jdk-19\\bin\\java", ["-Xmx350M", "-jar", "Lavalink.jar"], {
    cwd: path.join(__dirname, "../lavalink"),
  });

  await new Promise<void>((resolve) => {
    lavalinkProcess.stdout.on("data", (data) => {
      if (data.toString("utf-8").includes("Started Launcher")) return resolve();
    });
  });
  console.timeEnd("Lavalink startup time");
}

// Start command handler
await commandHandler.initialize(client);
await eventHandler.initialize(client);

// Launch bot
await client.run(process.env.TOKEN);
console.timeEnd("Bot start time");

// Relay voice data to Lavalink server
client.on("raw", (data) => client.audioManager.updateVoiceState(data));

process.on("unhandledRejection", e => console.error(e));
