const { Collection } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const { REST } = require("@discordjs/rest");
const { PermissionsBitField } = require("discord.js");

const botConfig = require("./config.json");

const utils = require("./utils.js");
const { embedMessage, checkBoolean } = utils;
const registerCommand = require("./BACH/registerCommand");
const LiveCollection = require("./classes/LiveCollection");
const CommandCooldownHandler = require("./classes/CommandCooldownHandler");
const ServerManager = require("./classes/ServerManager");

const disabledCommands = require("./models/disabledCommands");
const disabledEvents = require("./models/disabledEvents");
const restrictedChannels = require("./models/restrictedChannels");
const restrictedRoles = require("./models/restrictedRoles");
const users = require("./models/users");
const servers = require("./models/servers");

async function initialize(client, config = {}) {
  const chalk = await import("chalk");
  const { prefix, commandsDir } = config;

  console.log(chalk.default.blue("Starting Bluegarian Advanced Command Handler..."));

  const commands = utils.getAllFiles(commandsDir || "./commands").filter((file) => file.endsWith(".js"));
  const slashCommandsPayload = [];

  client.BACH = {};

  client.BACH.commands = new Collection();
  client.BACH.commandCooldowns = new CommandCooldownHandler();

  client.BACH.disabledCommands = new LiveCollection(disabledCommands);
  console.log("Initializing disabled commands...");
  await client.BACH.disabledCommands.init();
  console.log("Initialized disabled command");

  client.BACH.disabledEvents = new LiveCollection(disabledEvents);
  console.log("Initializing disabled events...");
  await client.BACH.disabledEvents.init();
  console.log("Initialized disabled events");

  client.BACH.users = new LiveCollection(users);
  console.log("Initializing users...");
  await client.BACH.users.init();
  console.log("Initialized users");

  const _servers = new LiveCollection(servers);
  console.log("Initializing servers...");
  await _servers.init();
  client.BACH.servers = new ServerManager(client, _servers);
  console.log("Initialized servers");

  client.BACH.restrictedChannels = new LiveCollection(restrictedChannels);
  console.log("Initializing restricted channels...");
  await client.BACH.restrictedChannels.init();
  console.log("Initialized restricted channels");

  client.BACH.restrictedRoles = new LiveCollection(restrictedRoles);
  console.log("Initializing restricted roles...");
  await client.BACH.restrictedRoles.init();
  console.log("Initialized restricted roles");

  let helpData;
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];

    if (command.endsWith("help.js")) {
      helpData = command;
      continue;
    }

    const registration = await registerCommand.register(client, command);
    if (registration) slashCommandsPayload.push(registration.data.toJSON());
  }

  const helpCmdRegisteration = await registerCommand.register(client, helpData);
  slashCommandsPayload.push(helpCmdRegisteration.data.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    console.log("Started refreshing application (/) commands.");

    if (process.env.NODE_ENV === "production") {
      await rest.put(Routes.applicationCommands("969385645963370496"), { body: slashCommandsPayload });
    } else {
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "738768458627416116"), { body: slashCommandsPayload }); // EE server
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "905595623208796161"), { body: slashCommandsPayload }); // Jesus server
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "834471563331371078"), { body: slashCommandsPayload }); // Donuts server
      await rest.put(Routes.applicationGuildCommands("969385645963370496", "951662182846836968"), { body: slashCommandsPayload }); // Four Wheels server
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
    try {
      if (message.author.bot) return;
      if (message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`))
        return client.BACH.commands.get("help").execute(message, { client, config: botConfig, reply: messageReply });
      if (!message.content.startsWith(prefix)) return;

      const user = client.BACH.users.getAll().find((userObj) => userObj.userId === message.author.id);

      const args = message.content.slice(prefix.length).trim().split(/ +/g);
      const command = findTextCommand(args[0].toLowerCase());
      if (!command) return;

      async function sendMessage(content = "", ping = false, options = {}) {
        content == null ? null : content.substring(0, 2000);

        const reply = {
          content,
          allowedMentions: {
            repliedUser: ping,
          },
          ...options,
        };

        return await message.channel.send(reply);
      }

      async function messageReply(content = "", ping = false, options = {}) {
        content == null ? null : content.substring(0, 2000);

        const reply = {
          content,
          allowedMentions: {
            repliedUser: ping,
          },
          ...options,
        };

        return await message.reply(reply);
      }

      async function embedMessageReply(title, text, status, ping = false, options = {}) {
        const reply = {
          embeds: [embedMessage(title, text, status)],
          allowedMentions: {
            repliedUser: ping,
          },
          ...options,
        };

        return await message.reply(reply);
      }

      if (client.BACH.commandCooldowns.validate(message.author.id, message.guildId)) {
        const reply = await embedMessageReply(
          "Command on cooldown",
          `You must wait ${client.BACH.commandCooldowns.get(message.author.id, message.guildId)}s before using that again`,
          "warn"
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
        return;
      }

      if (user?.elevation === 0) return await embedMessageReply("You are banned", `You have been blacklisted from using BLUE.`, "error");

      if (command.elevation > (user?.elevation || 1))
        return await embedMessageReply("Access Denied", `Level ${command.elevation} clearance required.`, "error");

      const guildDisabledCommands = client.BACH.disabledCommands.getAll().find((doc) => doc.guildId === message.guildId);
      if (guildDisabledCommands != null && guildDisabledCommands.commands.includes(command.id) && message.author.id !== client.application.owner.id)
        return await embedMessageReply("Command Disabled", "This command is disabled in the server", "error");

      if (
        command.permissions != null &&
        !command.permissions.every((flag) => message.member.permissions.has(PermissionsBitField.Flags[flag])) &&
        message.author.id !== client.application.owner.id
      )
        return await embedMessageReply("Invalid Permissions", `You require \`${command.permissions.join(", ")}\` permissions to run this command`, "error");

      const restrictedRoles = client.BACH.restrictedRoles.getAll().find((doc) => doc.guildId === message.guildId);
      const restrictedRolesCommand = restrictedRoles?.commands?.find((cmd) => cmd.command === command.id);

      if (
        restrictedRoles != null &&
        restrictedRolesCommand != null &&
        !restrictedRolesCommand.roles.every((role) => message.member.roles.cache.has(role)) &&
        message.author.id !== client.application.owner.id
      )
        return await embedMessageReply(
          "Insufficient roles",
          `You require the following roles to use this command: ${restrictedRolesCommand.roles.reduce((total, value) => {
            return total + "\n<@&" + value + ">";
          }, "\n")}`,
          "error"
        );

      const restrictedChannel = client.BACH.restrictedChannels.getAll().find((doc) => doc.guildId === message.guildId);
      const restrictedChannelCommands = restrictedChannel?.commands?.find((cmd) => cmd.command === command.id);

      if (
        restrictedChannel != null &&
        restrictedChannelCommands != null &&
        !restrictedChannelCommands?.channels.includes(message.channelId) &&
        message.author.id !== client.application.owner.id
      )
        return await embedMessageReply(
          "Command restricted",
          `This command can only be run in the following channels: ${restrictedChannelCommands.channels.reduce((total, value) => {
            return total + "\n<#" + value + ">";
          }, "\n")}`,
          "error"
        );

      args.shift();

      function validateArg(expectedArg, i) {
        switch (expectedArg.type.toLowerCase()) {
          case "string": {
            if (expectedArg.trailing) {
              if (!args.join(" ").includes('"'))
                return new Error(`Argument ${i + 1} (${expectedArg.name}) could have spaces. Wrap the target argument in quotations ("...").`);
              const newargs = args.join(" ").match(/"([^"\\]*(?:\\.[^"\\]*)*)"|\S+/g);
              args.splice(i, newargs.length - 1);
              return (args[i] = newargs[i].replace(/"/g, ""));
            }
            return (args[i] = args[i].trim());
          }
          case "integer": {
            const int = parseInt(args[i]);
            if (isNaN(int)) {
              return new Error(`Not an integer: integer expected at argument ${i + 1}: ${expectedArg.name}`);
            }
            if (expectedArg.min != null)
              if (int < expectedArg.min) return new Error(`Integer smaller than min value of ${expectedArg.min}: at argument ${i + 1}: ${expectedArg.name}`);
            if (expectedArg.max != null)
              if (int > expectedArg.max) return new Error(`Integer smaller than max value of ${expectedArg.max}: at argument ${i + 1}: ${expectedArg.name}`);
            return (args[i] = int);
          }
          case "number": {
            const num = parseFloat(args[i]);
            if (isNaN(num)) {
              return new Error(`Not a number: number expected at argument ${i + 1}: ${expectedArg.name}`);
            }
            if (expectedArg.min != null)
              if (num < expectedArg.min) return new Error(`Number smaller than min value of ${expectedArg.min}: at argument ${i + 1}: ${expectedArg.name}`);
            if (expectedArg.max != null)
              if (num > expectedArg.max) return new Error(`Number smaller than max value of ${expectedArg.max}: at argument ${i + 1}: ${expectedArg.name}`);
            return (args[i] = num);
          }
          case "boolean": {
            const bool = checkBoolean(args[i]);
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
          return [new Error(`Unknown sub command, expected ${command.expectedArgs.reduce((total, value) => total + value.name + " | ", "")}`)];
        args.shift();
        const result = subcommandRaw.expectedArgs.map((expectedArg, i) => {
          if (args[i] == null && expectedArg[i + 1] != null && expectedArg[i + 1]?.required == null) return new Error(`${expectedArg.name} is required`);
          if (args[i] == null && expectedArg.required === true) return new Error(`${expectedArg.name} is required`);
          if (args[i] == null && expectedArg[i] == null && expectedArg[i]?.required == null && expectedArg[i + 1] == null) return;
          if (expectedArg.options) {
            const optionsList = [];

            for (let o = 0, n = expectedArg.options.length; o < n; ++o) {
              if (expectedArg.options[o].name.toLowerCase() === args[i].toLowerCase()) return (args[i] = expectedArg.options[o].value);
              optionsList.push(expectedArg.options[o].name);
            }
            return new Error(`${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArg.name}`);
          }

          return validateArg(expectedArg, i);
        });

        return result;
      }

      const validationResult = command.subcommanded
        ? validateSubcommand(command.expectedArgs.find((subcommandRaw) => subcommandRaw.name === subcommand))
        : command.expectedArgs.map((expectedArg, i) => {
            if (args[i] == null && expectedArg[i + 1] != null && expectedArg[i + 1]?.required == null) return new Error(`${expectedArg.name} is required`);
            if (args[i] == null && expectedArg.required === true) return new Error(`${expectedArg.name} is required`);
            if (args[i] == null && expectedArg[i] == null && expectedArg[i]?.required == null && expectedArg[i + 1] == null) return;
            if (expectedArg.options) {
              const optionsList = [];

              for (let o = 0, n = expectedArg.options.length; o < n; ++o) {
                if (expectedArg.options[o].name.toLowerCase() === args[i].toLowerCase()) return (args[i] = expectedArg.options[o].value);
                optionsList.push(expectedArg.options[o].name);
              }
              return new Error(`${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArg.name}`);
            }

            return validateArg(expectedArg, i);
          });

      for (const a of validationResult) {
        if (a instanceof Error) {
          return await embedMessageReply("Invalid usage!", a.message, "error", false);
        }
      }

      const props = {
        client,
        config: botConfig,
        guild: message.guild,
        guildId: message.guildId,
        user: message.author,
        member: message.member,
        channel: message.channel,
        channelId: message.channelId,
        subcommand,
        isInteraction: false,
        send: sendMessage,
        reply: messageReply,
        embedReply: embedMessageReply,
        args,
      };

      try {
        await command.execute(message, props);

        client.BACH.commandCooldowns.addCooldown(message.author.id, message.guildId, command.cooldown);
      } catch (err) {
        console.error(err);
        await message.reply({
          content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application.owner.id}>||`,
          embeds: [embedMessage(err.name, err.message, "error")],
        });
      }
    } catch (err) {
      console.error(err);
      await message.reply({
        content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application.owner.id}>||`,
        embeds: [embedMessage(err.name, err.message, "error")],
      });
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.BACH.commands.get(interaction.commandName);

    if (!command) return;

    let subcommand;

    if (command.subcommanded) {
      subcommand = interaction.options.getSubcommand();
    }

    const user = client.BACH.users.getAll().find((userObj) => userObj.userId === interaction.user.id);

    async function sendMessage(content = "", ping = false, options = {}) {
      content == null ? null : content.substring(0, 2000);

      const reply = {
        content,
        allowedMentions: {
          repliedUser: ping,
        },
        ...options,
      };

      return await interaction.channel.send(reply);
    }

    async function interactionReply(content = "", ephemeral = false, options = {}) {
      content == null ? null : content.substring(0, 2000);
      const reply = {
        content,
        ephemeral,
        ...options,
      };

      return await interaction.reply(reply);
    }

    async function embedInteractionReply(title, text, status, ephemeral = false, options = {}) {
      const reply = {
        embeds: [embedMessage(title, text, status)],
        ephemeral,
        ...options,
      };

      return await interaction.reply(reply);
    }

    if (client.BACH.commandCooldowns.validate(interaction.user.id, interaction.guildId)) {
      const reply = await embedInteractionReply(
        "Command on cooldown",
        `You must wait ${client.BACH.commandCooldowns.get(interaction.user.id, interaction.guildId)}s before using that again`,
        "warn",
        false,
        { fetchReply: true }
      );
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);
      return;
    }

    if (user?.elevation === 0) return await embedInteractionReply("You are banned", `You have been blacklisted from using BLUE.`, "error");

    if (command.elevation > (user?.elevation + 1 || 2) - 1)
      return await embedInteractionReply("Access Denied", `Level ${command.elevation} clearance required.`, "error");

    const guildDisabledCommands = client.BACH.disabledCommands.getAll().find((cmd) => cmd.guildId === interaction.guildId);
    if (guildDisabledCommands && guildDisabledCommands.commands.includes(command.id) && interaction.user.id !== client.application.owner.id)
      return await embedInteractionReply("Command Disabled", "This command is disabled in the server", "error");

    if (
      command.permissions &&
      !command.permissions.every((flag) => interaction.member.permissions.has(PermissionsBitField.Flags[flag])) &&
      interaction.user.id !== client.application.owner.id
    )
      return await embedInteractionReply("Invalid Permissions", `You require \`${command.permissions.join(", ")}\` permissions to run this command`, "error");

    const restrictedRoles = client.BACH.restrictedRoles.getAll().find((doc) => doc.guildId === interaction.guildId);
    const restrictedRolesCommand = restrictedRoles?.commands?.find((cmd) => cmd.command === command.id);

    if (
      restrictedRoles != null &&
      restrictedRolesCommand != null &&
      !restrictedRolesCommand.roles.every((role) => interaction.member.roles.cache.has(role)) &&
      interaction.user.id !== client.application.owner.id
    )
      return await embedInteractionReply(
        "Insufficient roles",
        `You require the following roles to use this command: ${restrictedRolesCommand.roles.reduce((total, value) => {
          return total + "\n<@&" + value + ">";
        }, "\n")}`,
        "error"
      );

    const restrictedChannel = client.BACH.restrictedChannels.getAll().find((doc) => doc.guildId === interaction.guildId);
    const restrictedChannelCommands = restrictedChannel?.commands?.find((cmd) => cmd.command === command.id);

    if (
      restrictedChannel != null &&
      restrictedChannelCommands != null &&
      !restrictedChannelCommands?.channels.includes(interaction.channelId) &&
      interaction.user.id !== client.application.owner.id
    )
      return await embedInteractionReply(
        "Command restricted",
        `This command can only be run in the following channels: ${restrictedChannelCommands.channels.reduce((total, value) => {
          return total + "\n<#" + value + ">";
        }, "\n")}`,
        "error"
      );

    const args = [];

    function subargParse(arg) {
      for (const subarg of arg.expectedArgs) {
        let interactionOption;
        interactionOption = interaction.options["get" + subarg.type](subarg.name);
        if (!arg.required && interactionOption == null) continue;
        args.push(interactionOption);
      }
    }

    for (const arg of command.expectedArgs) {
      let interactionOption;

      if (command.subcommanded == null) {
        interactionOption = interaction.options.get(arg.name);
        if (!arg.required && interactionOption == null) continue;
        args.push(interactionOption.value);
      } else {
        if (arg.name !== subcommand) continue;
        subargParse(arg);
        break;
      }
    }

    const props = {
      client,
      config: botConfig,
      guild: interaction.guild,
      guildId: interaction.guildId,
      user: interaction.user,
      member: interaction.member,
      channel: interaction.channel,
      channelId: interaction.channelId,
      isInteraction: true,
      subcommand,
      send: sendMessage,
      reply: interactionReply,
      embedReply: embedInteractionReply,
      args,
    };

    if (command.id === "help") props.config = botConfig;

    try {
      await command.execute(interaction, props);

      client.BACH.commandCooldowns.addCooldown(interaction.user.id, interaction.guildId, command.cooldown);
    } catch (err) {
      console.error(chalk.default.red(`${err}`));
      if (interaction.replied) {
        await interaction.channel.send({
          content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application.owner.id}>||`,
          embeds: [embedMessage(err.name, err.message, "error")],
        });
      } else
        await interaction.reply({
          content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application.owner.id}>||`,
          embeds: [embedMessage(err.name, err.message, "error")],
        });
    }
  });
}

module.exports = { initialize };
