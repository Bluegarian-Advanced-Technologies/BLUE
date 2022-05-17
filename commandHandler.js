const { Collection } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const { Permissions } = require("discord.js");

const botConfig = require("./config.json");

const utils = require("./utils.js");
const { embedMessage } = utils;
const registerCommand = require("./BACH/registerCommand");
const LiveCollection = require("./classes/LiveCollection");

const disabledCommands = require("./models/disabledCommands");
const disabledEvents = require("./models/disabledEvents");
const users = require("./models/users");

async function initialize(client, config = {}) {
  const chalk = await import("chalk");
  const { prefix, commandsDir } = config;

  console.log(chalk.default.blue("Starting Bluegarian Advanced Command Handler..."));

  const commands = utils.getAllFiles(commandsDir || "./commands").filter((file) => file.endsWith(".js"));
  const slashCommandsPayload = [];

  client.BACH = {};

  client.BACH.commands = new Collection();

  client.BACH.disabledCommands = new LiveCollection(disabledCommands);
  console.log("Initializing disabled commands...");
  await client.BACH.disabledCommands.init();
  console.log("Done");

  client.BACH.disabledEvents = new LiveCollection(disabledEvents);
  console.log("Initializing disabled events...");
  await client.BACH.disabledEvents.init();
  console.log("Done");

  client.BACH.users = new LiveCollection(users);
  console.log("Initializing users...");
  await client.BACH.users.init();
  console.log("Done");

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const registration = await registerCommand.register(client, command);
    if (registration) slashCommandsPayload.push(registration.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    if (process.env.NODE_ENV === "production") {
      await rest.put(Routes.applicationCommands("969385645963370496"), { body: slashCommandsPayload });
    } else {
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "738768458627416116"), { body: slashCommandsPayload });
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "905595623208796161"), { body: slashCommandsPayload });
    }

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  function findTextCommand(cmd) {
    const query = client.BACH.commands.get(cmd);
    if (query?.alias) return client.BACH.commands.get(query.cmdName);
    return query;
  }

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`))
      return client.BACH.commands.get("help").execute(message, { client, config: botConfig });
    if (!message.content.startsWith(prefix)) return;

    const user = client.BACH.users.getAll().find((userObj) => userObj.userId === message.author.id);

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = findTextCommand(args[0].toLowerCase());
    if (!command) return;

    function messageReply(content = "", ping = false, options = {}) {
      const { embeds, files, tts } = options;
      const reply = {
        allowedMentions: {
          repliedUser: ping,
        },
      };

      if (content) reply.content = content.substring(0, 2000);
      if (embeds) reply.embeds = embeds;
      if (files) reply.files = files;
      if (tts) reply.tts = tts;

      message.reply(reply);
    }

    function embedMessageReply(title, text, status, ping = false, options = {}) {
      const { files } = options;

      const reply = {
        embeds: [embedMessage(title, text, status)],
        allowedMentions: {
          repliedUser: ping,
        },
      };

      if (files) reply.files = files;

      message.reply(reply);
    }

    if (command.elevation && command.elevation > (user?.elevation || 1))
      return embedMessageReply("Access Denied", `Level ${command.elevation} clearance required.`, "error");

    const guildDisabledCommands = client.BACH.disabledCommands.getAll().find((doc) => doc.guildId === message.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command.id))
      return embedMessageReply("Command Disabled", "This command is disabled in the server", "error");

    if (command.permissions && !command.permissions.every((flag) => message.member.permissions.has(Permissions.FLAGS[flag])))
      return embedMessageReply("Invalid Permissions", `You require \`${command.permissions.join(", ")}\` to run this command`, "error");

    args.shift();

    function validateArg(expectedArg, i) {
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
    }

    let subcommand = args[0]?.toLowerCase();

    function validateSubcommand(subcommandRaw) {
      if (subcommandRaw == null)
        return [
          new Error(`Unknown sub command, expected ${command.expectedArgs.reduce((total, value) => (total += value.name + "|"), command.expectedArgs[0])}`),
        ];
      const result = subcommandRaw.expectedArgs.map((expectedArg, i) => {
        if (!expectedArg.required) return;
        if (!args[i]) return new Error(`${expectedArg.name} is required`);
        if (expectedArg.options) {
          const optionsList = [];

          for (let o = 0, n = expectedArg.options.length; o < n; ++o) {
            if (expectedArg.options[o].name.toLowerCase() === args[i].toLowerCase()) return (args[i] = expectedArg.options[o].value);
            optionsList.push(expectedArg.options[o].name);
          }
          return new Error(`Not ${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArg.name}`);
        }

        validateArg(expectedArg, i + 1);
      });

      args.shift();

      return result;
    }

    const validationResult = command.subcommanded
      ? validateSubcommand(command.expectedArgs.find((subcommandRaw) => subcommandRaw.name === subcommand))
      : command.expectedArgs.map((expectedArg, i) => {
          if (!expectedArg.required) return;
          if (!args[i]) return new Error(`${expectedArg.name} is required`);
          if (expectedArg.options) {
            const optionsList = [];

            for (let o = 0, n = expectedArg.options.length; o < n; ++o) {
              if (expectedArg.options[o].name.toLowerCase() === args[i].toLowerCase()) return (args[i] = expectedArg.options[o].value);
              optionsList.push(expectedArg.options[o].name);
            }
            return new Error(`Not ${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArg.name}`);
          }

          return validateArg(expectedArg, i);
        });

    for (const a of validationResult) {
      if (a instanceof Error) {
        return message.channel.send(a.message);
      }
    }

    const props = {
      client,
      config: botConfig,
      guildId: message.guildId,
      user: message.user,
      member: message.member,
      channel: message.channel,
      channelId: message.channelId,
      permissions: message,
      isInteraction: false,
      subcommand,
      reply: messageReply,
      embedReply: embedMessageReply,
      args,
    };

    try {
      await command.execute(message, props);
    } catch (err) {
      console.error(err);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.BACH.commands.get(interaction.commandName);

    if (!command) return;

    const user = client.BACH.users.getAll().find((userObj) => userObj.userId === interaction.user.id);

    function interactionReply(content = "", ephemeral = false, options = {}) {
      const { embeds, files, tts } = options;
      const reply = {
        ephemeral,
      };

      if (content) reply.content = content.substring(0, 2000);
      if (embeds) reply.embeds = embeds;
      if (files) reply.files = files;
      if (tts) reply.tts = tts;

      interaction.reply(reply);
    }

    function embedInteractionReply(title, text, status, ephemeral = false, options = {}) {
      const { files } = options;

      const reply = {
        embeds: [embedMessage(title, text, status)],
        ephemeral,
      };

      if (files) reply.files = files;

      interaction.reply(reply);
    }

    if (command.elevation && command.elevation > (user?.elevation || 1))
      return embedInteractionReply("Access Denied", `Level ${command.elevation} clearance required.`, "error");

    const guildDisabledCommands = client.BACH.disabledCommands.getAll().find((cmd) => cmd.guildId === interaction.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command.id))
      return embedInteractionReply("Command Disabled", "This command is disabled in the server", "error");

    if (command.permissions && !command.permissions.every((flag) => interaction.member.permissions.has(Permissions.FLAGS[flag])))
      return embedInteractionReply("Invalid Permissions", `You require \`${command.permissions.join(", ")}\` to run this command`, "error");

    const args = [];

    for (const arg of command.expectedArgs) {
      let interactionOption;

      if (!command.subcommanded) {
        interactionOption = interaction.options.get(arg.name);
        if (!arg.required && !interactionOption) continue;
        args.push(interactionOption.value);
      } else {
        for (const subarg of arg.expectedArgs) {
          interactionOption = interaction.options["get" + subarg.type](subarg.name);
          if (!arg.required && !interactionOption) continue;
          args.shift();
          args.push(interactionOption);
        }
      }
    }

    const props = {
      client,
      config: botConfig,
      guildId: interaction.guildId,
      user: interaction.user,
      member: interaction.member,
      channel: interaction.channel,
      channelId: interaction.channelId,
      isInteraction: true,
      subcommand: interaction.options.getSubcommand(),
      reply: interactionReply,
      embedReply: embedInteractionReply,
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
