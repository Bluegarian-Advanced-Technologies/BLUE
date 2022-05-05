const { Collection } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const { Permissions } = require("discord.js");

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
    const registration = registerCommand.register(client, command);
    if (registration) slashCommandsPayload.push(registration.data.toJSON());
  }

  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

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

  const findTextCommand = (cmd) => {
    const query = client.commands.get(cmd);
    if (query?.alias) return client.commands.get(query.cmdName);
    return query;
  };

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`))
      return client.commands.get("help").execute(message, { client, config: botConfig });
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = findTextCommand(args[0]);
    if (!command) return;

    const guildDisabledCommands = client.disabledCommands.getAll().find((doc) => doc.guildId === message.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command.id)) return; // TODO: Display command disabled msg

    if (command.permissions && !command.permissions.every((flag) => message.member.permissions.has(Permissions.FLAGS[flag]))) return; // TODO: Send insufficient permissons message

    args.shift();

    // Validate args
    const validationResult = command.expectedArgs.map((expectedArg, i) => {
      if (!args[i]) return new Error(`${expectedArg.name} is required`);
      if (expectedArg.options) {
        const optionsList = [];

        for (let o = 0, n = expectedArg.options.length; o < n; ++o) {
          if (expectedArg.options[o].name.toLowerCase() === args[i].toLowerCase()) return (args[i] = expectedArg.options[o].value);
          optionsList.push(expectedArg.options[o].name);
        }
        return new Error(`Not ${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArg.name}`);
      }

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
      guildId: message.guildId,
      user: message.user,
      member: message.member,
      channel: message.channel,
      channelId: message.channelId,
      permissions: message,
      isInteraction: false,
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

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const guildDisabledCommands = client.disabledCommands.getAll().find((cmd) => cmd.guildId === interaction.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command.id)) return; // TODO: Display command disabled msg

    if (command.permissions && !command.permissions.every((flag) => interaction.member.permissions.has(Permissions.FLAGS[flag]))) return; // TODO: Send insufficient permissons message

    const args = [];

    for (const arg of command.expectedArgs) {
      args.push(interaction.options.get(arg.name).value);
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
      args,
    };

    // try {
    await command.execute(interaction, props);
    // } catch (error) {
    //   console.error(chalk.default.red(`${error}`));
    //   await interaction.reply({ content: "Unfortunately, an error occured while executing this command.", ephemeral: true });
    // }
  });
}

module.exports = { initialize };
