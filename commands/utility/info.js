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

  execute: (cmd, { subcommand, guild, member, args, reply }) => {
    switch (subcommand) {
      case "server": {
        const embedData = {
          color: colors.primary,
          author: { name: `${guild.name} | ${guild.nameAcronym}`, iconURL: guild.iconURL() },
          fields: [
            {
              name: "Members",
              value: guild.memberCount.toString(),
            },
            {
              name: "Created",
              value: `<t:${Math.round(guild.createdTimestamp / 1000)}:D>`,
            },
            {
              name: "Owner",
              value: `<@${guild.ownerId}>`,
            },
          ],
        };

        if (guild.description != null) embedData.description = guild.description;

        if (args[0] === true) {
          embedData.fields.push({
            name: "AFK V.C.",
            value: `${guild.afkChannel}`,
          });
        }

        const baseEmbed = createEmbed(embedData);

        reply(null, false, {
          embeds: [baseEmbed],
        });

        break;
      }
      case "user": {
        const user = await member.user.fetch();

        const embedData = {
          color: user.hexAccentColor,
          author: { name: `${user.username + user.discriminator}${" | " + member.nickname === " | " ?? ""}`, iconURL: user.displayAvatarURL },
          fields: [
            {
              name: "Created",
              value: `<t:${Math.round(user.createdTimestamp / 1000)}:D>`,
            }
          ]
        }

        reply(null, false, {
          embeds: [],
        })

        break;
      }
      case "restricted": {
        switch (args[0]) {
        }

        break;
      }
    }
  },
};
