const { createEmbed } = require("../../utils");
const {colors} = require("../../config.json");

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
      expectedArgs: [{
        type: "Boolean",
        name: "complex",
        description: "Whether or not to list advanced info",
      },],
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

  execute: (cmd, { subcommand, guild, args }) => {
    switch (subcommand) {
      case "server": {

        const baseEmbed = createEmbed({
          color: colors.primary,
          author: { name: `${guild.name} | ${guild.nameAcronym}`  }
        })

        console.log(guild.icon)

        break;
      }
      case "user": {
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
