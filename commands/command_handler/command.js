module.exports = {
  id: "command",
  description: "Enable or disable commands",
  category: "Command Handler",
  slash: "both",
  aliases: [],
  expectedArgs: [
    {
      type: "String",
      name: "action",
      description: "Enable or disable command",
      options: [
        {
          name: "Enable",
          value: "on",
        },
        {
          name: "Disable",
          value: "off",
        },
      ],
      required: true,
    },
    {
      type: "String",
      name: "command",
      description: "Targetted command",
      required: true,
    },
  ],

  permissions: ["MANAGE_GUILD"],

  execute: async (cmd, { client, guildId, args }) => {
    const targetCommand = args[1];
    switch (args[0]) {
      case "on":
        break;
      case "off":
        await client.disabledCommands.set({
          guildId,
          command,
        });

        break;
      default:
    }

    cmd.reply({
      content: "Check console",
    });
  },
};
