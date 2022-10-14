import { createEmbed, EmbedData, formatTime } from "../../utilities";
import settings from "../../settings.json" assert { type: "json" };

import os from "os";
import Command from "../../classes/Command";
import { ApplicationCommandOptionType, ColorResolvable, User } from "discord.js";
import { RestrictedChannelCommand, RestrictedRoleCommand } from "../../classes/BACH";

const cpus = os.cpus();
const cpu = cpus[0];

export default new Command({
  id: "info",
  description: "Attain information varying items",
  category: "Utility",
  aliases: ["i"],
  slash: "both",
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "server",
      description: "Attain information on this server",
      options: [
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "complex",
          description: "Whether or not to list advanced info",
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "user",
      description: "Attain information on a user in this server",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "The desired user",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "advanced",
          description: "Whether or not to list advanced info",
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "restricted",
      description: "Attain information disabled/restricted items in this server",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "category",
          description: "Which category of disabled/restricted items to view",
          required: true,
          choices: [
            {
              name: "Disabled commands",
              value: "dc",
            },
            {
              name: "Disabled events",
              value: "de",
            },
            {
              name: "Restricted channels",
              value: "rc",
            },
            {
              name: "Restricted roles",
              value: "rr",
            },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "bot",
      description: "Attain bot information",
      options: [],
    },
  ],
  permissions: [],
}, async (client, context) => {
  switch (context.subcommand) {
    case "server": {
      const embedData: EmbedData = {
        color: settings.colors.primary as ColorResolvable,
        author: { name: `${context.guild.name} | ${context.guild.nameAcronym}`, iconURL: context.guild.iconURL()!, },
        fields: [
          {
            name: "Members",
            value: context.guild.memberCount.toString(),
            inline: true,
          },
          {
            name: "Bots",
            value: `${(await context.guild.members.fetch()).reduce((total, member) => {
              if (member.user.bot) {
                return total + 1;
              } else {
                return total;
              }
            }, 0)}`,
            inline: true,
          },
          {
            name: "Created",
            value: `<t:${Math.round(context.guild.createdTimestamp / 1000)}:D>`,
            inline: true,
          },
          {
            name: "Owner",
            value: `<@${context.guild.ownerId}>`,
            inline: true,
          },
        ],
      };

      if (context.guild.description != null) embedData.description = context.guild.description;

      if (context.options[0] === true) {
        embedData.fields!.push(
          {
            name: "AFK V.C.",
            value: `${context.guild.afkChannel ? context.guild.afkChannel : "None"}`,
            inline: true,
          },
          {
            name: "Channels",
            value: `${
              context.guild.channels.cache.reduce((total, channel) => {
                if (channel.isTextBased() || channel.isVoiceBased()) ++total;
                return total;
              }, 0) ?? "??"
            }`,
            inline: true,
          },
          {
            name: "Bans",
            value: `${context.guild?.bans?.cache?.size ?? "Unknown"}`,
            inline: true,
          }
        );
      }

      const baseEmbed = createEmbed(embedData);

      await context.reply({
        embeds: [baseEmbed],
      });

      break;
    }
    case "user": {
      const user = context.options[0] as User;

      let targetMember;
      try {
        targetMember = await context.guild.members.fetch(user.id);
      } catch {
        return await context.embedReply("User not found", "The user given is not in this server", "error");
      }

      await context.reply({
        embeds: [createEmbed({
          color: user.hexAccentColor!,
          author: {
            name: `${user.username + "#" + user.discriminator}${targetMember.nickname ? " | " + targetMember.nickname : ""}`,
            iconURL: user.displayAvatarURL(),
          },
          fields: [
            {
              name: "Account Created",
              value: `<t:${Math.round(user.createdTimestamp / 1000)}:D>`,
              inline: true,
            },
            {
              name: "Bot",
              value: `${user.bot ? "Yes" : "No"}`,
              inline: true,
            },
            {
              name: "P.F.P.",
              value: `[->URL<-](${user.avatarURL({ extension: "png", size: 4096 })})`,
              inline: true,
            },
          ],
        })],
      });

      break;
    }
    case "restricted": {
      switch (context.options[0]) {
        case "dc": {
          const disabledCommands = client.bach.disabledCommands.getAll().find((cmd) => cmd.guildId === context.guild.id);

          if (disabledCommands == null || disabledCommands.commands.length === 0) return await context.embedReply("No disabled commands", undefined, "warn");

          const disabledCommandsList = disabledCommands.commands.join(", ");

          await context.embedReply("Disabled Commands", disabledCommandsList);

          break;
        }
        case "de": {
          const disabledEvents = client.bach.disabledEvents.getAll().find((event) => event.guildId === context.guild.id);

          if (disabledEvents == null || disabledEvents.events.length === 0) return await context.embedReply("No disabled events", undefined, "warn");

          const disabledEventsList = disabledEvents.events.join(", ");

          await context.embedReply("Disabled Events", disabledEventsList);

          break;
        }
        case "rc": {
          const restrictedChannels = client.bach.restrictedChannels.getAll().find((cmd) => cmd.guildId === context.guild.id);

          if (restrictedChannels == null || restrictedChannels.commands.length === 0) return await context.embedReply("No restricted commands", undefined, "warn");

          let restrictedList = "";

          (restrictedChannels.commands as RestrictedChannelCommand[]).forEach((command, i) => {
            if (command.channels.length === 0) return;
            restrictedList += `**${i > 0 ? "\n\n" : ""}${command.command}**\n${command.channels.reduce((total, channel, i) => {
              return total + `${i + 1 === command.channels.length && command.channels.length > 1 ? ", " : ""}<#${channel}>`;
            }, "")}`;
          });

          if (restrictedList.length === 0) {
            await context.embedReply("No restricted commands", undefined, "warn");
          } else {
            await context.embedReply("Restricted Command Channels", restrictedList);
          }

          break;
        }
        case "rr": {
          const restrictedRoles = client.bach.restrictedRoles.getAll().find((cmd) => cmd.guildId === context.guild.id);

          if (restrictedRoles == null || restrictedRoles.commands.length === 0) return await context.embedReply("No restricted command roles", undefined, "warn");

          let restrictedList = "";

          (restrictedRoles.commands as RestrictedRoleCommand[]).forEach((role, i) => {
            if (role.roles.length === 0) return;
            restrictedList += `**${i > 0 ? "\n\n" : ""}${role.command}**\n${role.roles.reduce((total, roleID, i) => {
              return total + `${i + 1 === role.roles.length && role.roles.length > 1 ? ", " : ""}<#${roleID}>`;
            }, "")}`;
          });

          if (restrictedList.length === 0) {
            context.embedReply("No restricted command roles", undefined, "warn");
          } else {
            await context.embedReply("Restricted Command Roles", restrictedList);
          }

          break;
        }
      }

      break;
    }
    case "bot": {
      const memory = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;

      await context.reply({
        embeds: [createEmbed({
          color: settings.colors.primary as ColorResolvable,
          author: {
            name: "BLUE System Information",
            iconURL: client.user!.displayAvatarURL(),
          },
          fields: [
            {
              name: "Memory usage",
              value: `${memory}MB`,
              inline: true,
            },
            {
              name: "CPU",
              value: `${cpu.model}`,
              inline: true,
            },
            {
              name: "Uptime",
              value: `${formatTime(Math.round(process.uptime() * 1000), true)}`,
              inline: true,
            },
            {
              name: "Servers",
              value: `${client.guilds.cache.size}`,
              inline: true,
            },
          ],
        })],
      });
    }
  }
});
