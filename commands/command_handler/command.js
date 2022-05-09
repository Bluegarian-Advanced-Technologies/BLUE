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

  execute: async (cmd, { client, guildId, channel, args }) => {
    const targetCommand = args[1];

    const cachedDisabledCommands = client.disabledCommands.getAll().find((doc) => doc.guildId === guildId);

    switch (args[0]) {
      case "on":
        if (!cachedDisabledCommands.commands.includes(targetCommand)) return channel.send("Command not disabled yet"); // TODO: Display not disabled message

        client.disabledCommands.update({ guildId, $pull: {commands: targetCommand} }, (commands) => 
          commands.filter((c) => c !== targetCommand)
        );

        break;
      case "off":
        if (!cachedDisabledCommands) {
          await client.disabledCommands.set({
            guildId,
            commands: [targetCommand],
          });
        } else {
          if (cachedDisabledCommands.commands.includes(targetCommand)) return channel.send("Command already disabled"); // TODO: Display already disabled message
          await client.disabledCommands.update({ guildId, $push: {commands: targetCommand} }, () => [...cachedDisabledCommands.commands, targetCommand]);
        }
        break;
      default:
    }

    cmd.reply({
      content: "Check console",
    });
  },
};
