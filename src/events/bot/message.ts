import { ApplicationCommandAutocompleteNumericOptionData, ApplicationCommandAutocompleteStringOptionData, ApplicationCommandChannelOptionData, ApplicationCommandNonOptionsData, ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData } from "discord.js";
import { OptionType } from "../../classes/BACH";
import Command from "../../classes/Command";
import { Context } from "../../classes/Context";
import Event from "../../classes/Event";
import settings from "../../settings.json" assert { type: "json" };
import { checkBoolean, embedMessage } from "../../utilities";

type ApplicationCommandPrimitiveData = Exclude<ApplicationCommandOptionData, ApplicationCommandNonOptionsData | ApplicationCommandSubGroupData | ApplicationCommandSubCommandData | ApplicationCommandChannelOptionData | ApplicationCommandAutocompleteNumericOptionData | ApplicationCommandAutocompleteStringOptionData>;

export default new Event({
  id: "message",
  once: false,
  eventType: "messageCreate",
  disableExempted: true,
}, async (client, message) => {
  const findTextCommand = (command: string): Command | undefined => {
    const query = client.bach.commands.get(command);
    if (query?.alias) return client.bach.commands.get(query.target) as Command;
    return query;
  };

  try {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith(`<@${client.user!.id}>`) || message.content.startsWith(`<@!${client.user!.id}>`))
      return message.reply(`Hello! I am BLUE. To see a list of commands, use the \`${settings.prefix}help\` command.`);
    if (!message.content.startsWith(settings.prefix)) return;
    
    const parameters = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    
    const command = findTextCommand(parameters.shift()?.toLowerCase() ?? "");
    if (!command) return;

    let subcommand: string | undefined;
    if (command.hasSubcommands) {
      subcommand = parameters.shift()?.toLowerCase();
      if (!subcommand) {
        return await message.reply({
          embeds: [embedMessage("Invalid subcommand", `You must provide a valid subcommand for the \`${command.id}\` command.`, "error")]
        });
      }
    }

    const matches = parameters.join(" ").match(/"([^"\\]*(?:\\.[^"\\]*)*)"\S*|\S+/g);
    const options = matches?.map((match) => match.replace(/(?<!\\)(?:"|\\)/g, "").trim()) ?? [];

    const context = Context.create(client, message, {
      subcommand,
      options 
    });

    const reply = await client.bach.runCommandChecks(command, context);
    if (reply) return;

    // client.bach.runPreflightChecks(context);

    const validateArg = async (arg: string, expectedArg: ApplicationCommandOptionData, i: number) => {
      switch (expectedArg.type) {
        case ApplicationCommandOptionType.String: {
          return arg;
        }
        case ApplicationCommandOptionType.Integer: {
          const int = parseInt(arg);
          if (isNaN(int)) {
            return new Error(`Not an integer: integer expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          if (expectedArg.minValue != null)
            if (int < expectedArg.minValue) return new Error(`Integer smaller than min value of ${expectedArg.minValue}: at argument ${i + 1}: ${expectedArg.name}`);
          if (expectedArg.maxValue != null)
            if (int > expectedArg.maxValue) return new Error(`Integer smaller than max value of ${expectedArg.maxValue}: at argument ${i + 1}: ${expectedArg.name}`);
          return int;
        }
        case ApplicationCommandOptionType.Number: {
          const num = parseFloat(arg);
          if (isNaN(num)) {
            return new Error(`Not a number: number expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          if (expectedArg.minValue != null)
            if (num < expectedArg.minValue) return new Error(`Number smaller than min value of ${expectedArg.minValue}: at argument ${i + 1}: ${expectedArg.name}`);
          if (expectedArg.maxValue != null)
            if (num > expectedArg.maxValue) return new Error(`Number smaller than max value of ${expectedArg.maxValue}: at argument ${i + 1}: ${expectedArg.name}`);
          return num;
        }
        case ApplicationCommandOptionType.Boolean: {
          const bool = checkBoolean(arg);
          if (typeof bool !== "boolean") {
            return new Error(`Not a boolean: boolean expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return bool;
        }
        case ApplicationCommandOptionType.User: {
          const user = arg.match(/<@!?(\d+)>/);
          if (!user) {
            return new Error(`Not a user: user expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          const userObj = await client.users.fetch(user[1]);
          if (!userObj) {
            return new Error(`Not a user: user expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return userObj;
        }
        case ApplicationCommandOptionType.Channel: {
          const channel = arg.match(/<#(\d+)>/);
          if (!channel) {
            return new Error(`Not a channel: channel expected at argument ${i + 1}: ${expectedArg.name}"`);
          }
          const channelObj = await context.guild.channels.fetch(channel[1]);
          if (!channelObj) {
            return new Error(`Not a channel: channel expected at argument ${i + 1}: ${expectedArg.name}"`);
          }
          return channelObj;
        }
        case ApplicationCommandOptionType.Role: {
          const role = arg.match(/<@&(\d+)>/);
          if (!role) {
            return new Error(`Not a role: role expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          const roleObj = await context.guild.roles.fetch(role[1]);
          if (!roleObj) {
            return new Error(`Not a role: role expected at argument ${i + 1}: ${expectedArg.name}`);
          }
          return roleObj;
        }
        // case ApplicationCommandOptionType.Mentionable: {
        //   const mentionable = arg.match(/<@(!|#|&)?(\d+)>/);
        //   if (!mentionable) {
        //     return new Error(`Not a mentionable: mentionable expected at argument: ${i + 1}, ${expectedArg.name}`);
        //   }
        //   return (arg = mentionable);
        // }

        default: {
          console.warn("Unrecognized arg type");
          return new Error(`Unrecognized arg type at argument ${i + 1}: ${expectedArg.name}`);
        }
      }
    }

    const richOptions: OptionType[] = [];
    if (command.hasSubcommands) {
      const subcommandRaw = command.options.find((sub) => sub.name === subcommand) as ApplicationCommandSubCommandData | undefined;
      if (subcommandRaw == null) return await context.embedReply("Invalid subcommand", "Please provide a valid subcommand", "error");
      // const validationResult = validateSubcommand(subcommandRaw as ApplicationCommandSubCommandData);
      // if (subcommandRaw == null)
      //   return new Error(`Unknown subcommand, expected ${command.options.reduce((total, value) => total + value.name + " | ", "")}`);
      for (let i = 0; i < subcommandRaw.options!.length; i++) {
        const expectedArg = subcommandRaw.options![i] as ApplicationCommandPrimitiveData;
        if (options[i] == null && expectedArg.required === true) 
          return await context.embedReply("Invalid usage!", `${expectedArg.name} is required`, "error", false);
        if (expectedArg.choices) {
          const optionsList = [];

          for (let j = 0; j < expectedArg.choices.length; j++) {
            if (expectedArg.choices[j].name.toLowerCase() === options[i].toLowerCase()) 
              richOptions.push(expectedArg.choices[j].value);
            optionsList.push(expectedArg.choices[j].name);
          }
          return await context.embedReply("Invalid usage!", `${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArg.name}`, "error", false);
        } else {
          const result = await validateArg(options[i], expectedArg, i);
          if (result instanceof Error) {
            return await context.embedReply("Invalid usage!", result.message, "error", false);
          }
          richOptions.push(result);
        }
      }
    } else {
      const expectedArgs = command.options as ApplicationCommandPrimitiveData[];
      for (let i = 0; i < expectedArgs.length; i++) {
        if (options[i] == null && expectedArgs[i].required) 
          return await context.embedReply("Invalid usage!", `${expectedArgs[i].name} is required`, "error", false);
        if (expectedArgs[i].choices) {
          const optionsList = [];

          for (let j = 0; j < expectedArgs[i].choices!.length; ++j) {
            if (expectedArgs[i].choices![j].name.toLowerCase() === options[i].toLowerCase()) 
              richOptions.push(expectedArgs[i].choices![j].value);
            optionsList.push(expectedArgs[i].choices![j].name);
          }
          return await context.embedReply("Invalid usage!", `${optionsList.join(" | ")} expected at argument ${i + 1}: ${expectedArgs[i].name}`, "error", false);
        } else {
          const result = await validateArg(options[i], expectedArgs[i], i);
          if (result instanceof Error) {
            return await context.embedReply("Invalid usage!", result.message, "error", false);
          }
          richOptions.push(result);
        }
      }
    }

    try {
      await command.execute(client, context);

      client.bach.commandCooldowns.addCooldown(context.user.id, context.guild.id, command.cooldown);
    } catch (e) {
      console.error(e);
      await message.reply({
        content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application!.owner!.id}>||`,
        embeds: [embedMessage((e as Error).name, (e as Error).message, "error")],
      });
    }
  } catch (e) {
    console.error(e);
    await message.reply({
      content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application!.owner!.id}>||`,
      embeds: [embedMessage((e as Error).name, (e as Error).message, "error")],
    });
  }
});
