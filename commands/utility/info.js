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
      expectedArgs: [],
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

  execute: (cmd, { subcommand, args }) => {
    switch (subcommand) {
      case "server": {
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
