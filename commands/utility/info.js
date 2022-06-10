const { createEmbed } = require("../../utils");
const { colors } = require("../../config.json");

module.exports = {
  id: "info",
  description: "Attain information varying items",
  category: "Utility",
  aliases: ["i"],
  slash: "both",
  expectedArgs: [
    {
      type: "Subcommand",
      name: "server",
      description: "Attain information on this server",
      expectedArgs: [
        {
          type: "Boolean",
          name: "complex",
          description: "Whether or not to list advanced info",
        },
      ],
    },
    {
      type: "Subcommand",
      name: "user",
      description: "Attain information on a user in this server",
      expectedArgs: [
        {
          type: "User",
          name: "user",
          description: "The desired user",
          required: true,
        },
        {
          type: "Boolean",
          name: "advanced",
          description: "Whether or not to list advanced info",
        },
      ],
    },
    {
      type: "Subcommand",
      name: "restricted",
      description: "Attain information disabled/restricted items in this server",
      expectedArgs: [
        {
          type: "String",
          name: "category",
          description: "Which category of disabled/restricted items to view",
          required: true,
          options: [
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
  ],

  execute: async (cmd, { client, subcommand, guild, guildId, member, isInteraction, args, reply, embedReply }) => {
    switch (subcommand) {
      case "server": {
        const embedData = {
          color: colors.primary,
          author: { name: `${guild.name} | ${guild.nameAcronym}`, iconURL: guild.iconURL(), url: null },
          fields: [
            {
              name: "Members",
              value: guild.memberCount.toString(),
              inline: true,
            },
            {
              name: "Bots",
              value: `${(await guild.members.fetch()).reduce((total, member) => {
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
              value: `<t:${Math.round(guild.createdTimestamp / 1000)}:D>`,
              inline: true,
            },
            {
              name: "Owner",
              value: `<@${guild.ownerId}>`,
              inline: true,
            },
          ],
        };

        if (guild.description != null) embedData.description = guild.description;

        if (args[0] === true) {
          embedData.fields.push(
            {
              name: "AFK V.C.",
              value: `${guild.afkChannel ? guild.afkChannel : "None"}`,
              inline: true,
            },
            {
              name: "Channels",
              value: `${
                guild?.channels?.cache?.reduce((total, channel) => {
                  if (channel.isTextBased() || channel.isVoiceBased()) ++total;
                  return total;
                }, 0) ?? "??"
              }`,
              inline: true,
            },
            {
              name: "Bans",
              value: `${guild?.bans?.cache?.size ?? "Unknown"}`,
              inline: true,
            }
          );
        }

        const baseEmbed = createEmbed(embedData);

        reply(null, false, {
          embeds: [baseEmbed],
        });

        break;
      }
      case "user": {
        let dynamicUser;
        if (isInteraction) {
          dynamicUser = args[0].id;
        } else {
          dynamicUser = args[0][1];
        }
        const userID = dynamicUser;

        let targetMember;
        try {
          targetMember = await guild.members.fetch(userID);
        } catch {
          return await embedReply("User not found", "The user given is not in this server", "error");
        }

        const user = await targetMember.user.fetch();

        const embedData = {
          color: user.hexAccentColor,
          author: {
            name: `${user.username + "#" + user.discriminator}${targetMember.nickname ? " | " + targetMember.nickname : ""}`,
            iconURL: user.displayAvatarURL(),
            url: null,
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
        };

        reply(null, false, {
          embeds: [createEmbed(embedData)],
        });

        break;
      }
      case "restricted": {
        switch (args[0]) {
          case "dc": {
            const disabledCommands = client.BACH.disabledCommands.getAll().find((cmd) => cmd.guildId === guildId);

            if (disabledCommands == null || disabledCommands.commands.length === 0) return await embedReply("No disabled commands", null, "warn");

            const disabledCommandsList = disabledCommands.commands.join(", ");

            await embedReply("Disabled Commands", disabledCommandsList);

            break;
          }
          case "de": {
            const disabledEvents = client.BACH.disabledEvents.getAll().find((event) => event.guildId === guildId);

            if (disabledEvents == null || disabledEvents.events.length === 0) return await embedReply("No disabled events", null, "warn");

            const disabledEventsList = disabledEvents.events.join(", ");

            await embedReply("Disabled Events", disabledEventsList);

            break;
          }
          case "rc": {
            break;
          }
          case "rr": {
            break;
          }
        }

        break;
      }
    }
  },
};
