const { Collection } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");

const botConfig = require("./config.json");

const utils = require("./utils.js");
const registerCommand = require("./BACH/registerCommand");
const LiveCollection = require("./classes/LiveCollection");

const disabledCommands = require("./models/disabledCommands");

async function initialize(client, config = {}) {
  const chalk = await import("chalk");
  const { prefix, commandsDir } = config;

  console.log(chalk.default.blue("\nStarting Bluegarian Advanced Command Handler..."));

  const commands = utils.getAllFiles(commandsDir || "./commands").filter((file) => file.endsWith(".js"));
  const slashCommandsPayload = [];

  client.commands = new Collection();
  client.disabledCommands = new LiveCollection(disabledCommands);
  await client.disabledCommands.init();

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const registration = await registerCommand.register(client, command);
    if (registration) slashCommandsPayload.push(registration.data.toJSON());
  }

  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    if (process.env.NODE_ENV === "production") {
      await rest.put(Routes.applicationCommands("969385645963370496"), { body: slashCommandsPayload });
    } else {
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "738768458627416116"), { body: slashCommandsPayload });
    }

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  const findTextCommand = (cmd) => {
    const query = client.commands.get(cmd);
    if (query?.alias) return client.commands.get(query.cmdName);
    return query;
  };

  client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`))
      return client.commands.get("help").execute(message, { client, config: botConfig });
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = findTextCommand(args[0]);
    if (!command) return;

    const guildDisabledCommands = client.disabledCommands.getAll().find((doc) => doc.guildId === message.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command)) return; // TODO: Display command disabled msg

    args.shift();

    // Validate args
    const validationResult = command.expectedArgs.map((expectedArg, i) => {
      if (!args[i]) return new Error(`${expectedArg.name} is required`);
      switch (expectedArg.type.toLowerCase()) {
        case "string": {
          return true;
        }
        case "integer": {
          const int = parseInt(args[i]);
          if (isNaN(int)) {
            return new Error(`Not a number: number expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return (args[i] = int);
        }
        case "number": {
          const num = parseFloat(args[i]);
          if (isNaN(num)) {
            return new Error(`Not a number: number expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return (args[i] = num);
        }
        case "boolean": {
          const bool = Boolean(args[i]);
          if (typeof bool !== "boolean") {
            return new Error(`Not a boolean: boolean expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return (args[i] = bool);
        }
        case "user": {
          const user = args[i].match(/<@!?(\d+)>/);
          if (!user) {
            return new Error(`Not a user: user expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return (args[i] = user);
        }
        case "channel": {
          const channel = args[i].match(/<#(\d+)>/);
          if (!channel) {
            return new Error(`Not a channel: channel expected at argument ${i + 1}: ${expectedArg.name}"`);
          }
          return (args[i] = channel);
        }
        case "role": {
          const role = args[i].match(/<@&(\d+)>/);
          if (!role) {
            return new Error(`Not a role: role expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return (args[i] = role);
        }
        case "mentionable": {
          const mentionable = args[i].match(/<@(!|#|&)?(\d+)>/);
          if (!mentionable) {
            return new Error(`Not a mentionable: mentionable expected at argument: ${i + 1}, ${expectedArg.name}`);
          }
          return (args[i] = mentionable);
        }

        default: {
          console.warn("Invalid arg type");
          return new Error(`Invalid arg type at argument ${i + 1}: ${expectedArg.name}`);
        }
      }
    });
    for (const a of validationResult) {
      if (a instanceof Error) {
        return message.channel.send(a.message);
      }
    }

    const props = {
      client,
      config: botConfig,
      guildID: message.guildId,
      user: message.user,
      member: message.member,
      channel: message.channel,
      channelID: message.channelId,
      permissions: message,
      isInteraction: false,
      args,
    };

    try {
      command.execute(message, props);
    } catch (err) {
      console.error(err);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const guildDisabledCommands = client.disabledCommands.getAll().find((cmd) => cmd.guildId === interaction.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command)) return; // TODO: Display command disabled msg

    const args = [];

    for (const arg of command.expectedArgs) {
      args.push(interaction.options.get(arg.name).value);
    }

    const props = {
      client,
      config: botConfig,
      guildID: interaction.guildId,
      user: interaction.user,
      member: interaction.member,
      channel: interaction.channel,
      channelID: interaction.channelId,
      isInteraction: true,
      args,
    };

    try {
      await command.execute(interaction, props);
    } catch (error) {
      console.error(chalk.default.red(`${error}`));
      await interaction.reply({ content: "Unfortunately, an error occured while executing this command.", ephemeral: true });
    }
  });
}

module.exports = { initialize };
