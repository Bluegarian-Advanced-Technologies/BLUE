module.exports = {
  id: "user",
  description: "Configure users",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 5,
  expectedArgs: [
    {
      type: "Subcommand",
      name: "elevation",
      description: "Configure user elevation",
      expectedArgs: [
        {
          type: "User",
          name: "user",
          description: "Target user",
          required: true,
        },
        {
          type: "Integer",
          name: "_elevation",
          description: "Desired elevation 0-5",
          required: true,
        },
      ],
    },
    {
      type: "Subcommand",
      name: "blacklist",
      description: "Add or remove user to bot blacklist",
      expectedArgs: [
        {
          type: "String",
          name: "action",
          description: "Desired action",
          required: true,
          options: [
            {
              name: "Add",
              value: "add",
            },
            {
              name: "Remove",
              value: "remove",
            },
          ],
        },
        {
          type: "User",
          name: "_user",
          description: "Target user",
          required: true,
        },
      ],
    },
  ],

  execute: (cmd, { client, channel, args, embedReply }) => {
    console.log(args);

    embedReply("Done", "Check console");
  },
};
