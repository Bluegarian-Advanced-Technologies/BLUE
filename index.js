const { Database, Environment } = require("@nextium/common");

if (process.env.NODE_ENV !== "production") {
  const env = Environment.load(["MONGODB_URI", "TOKEN"]);
  Object.keys(env).map((key) => (process.env[key] = env[key].trim()));
}

const { Client, Intents } = require("discord.js");
const { Manager } = require("erela.js");

const commandHandler = require("./commandHandler.js");
const eventHandler = require("./eventHandler.js");
const music = require("./music.js");

const config = require("./config.json");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES],
});

client.on("raw", (d) => client.manager.updateVoiceState(d));
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
const db = new Database(process.env.MONGODB_URI, "BLUE");

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
  await db.connect();
  await commandHandler.initialize(client, { prefix: config.prefix });
  await eventHandler.initialize(client);
  await client.login(process.env.TOKEN);

  client.user.setActivity(config.prefix + "help", { type: "LISTENING" });
})();
