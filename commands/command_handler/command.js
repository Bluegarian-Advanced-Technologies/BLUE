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

    const cachedDisabledCommands = client.disabledCommands.getAll().find((doc) => doc.guildId === guildId);

    // console.log(cachedDisabledCommands);

    switch (args[0]) {
      case "on":
        if (!cachedDisabledCommands.commands.includes(targetCommand)) return; // TODO: Display not disabled message

        await client.disabledCommands.update({ guildId }, { commands: cachedDisabledCommands.commands.filter((c) => c !== targetCommand) });

        break;
      case "off":
        if (!cachedDisabledCommands) {
          await client.disabledCommands.set({
            guildId,
            commands: [targetCommand],
          });
        } else {
          if (cachedDisabledCommands.commands.includes(targetCommand)) return; // TODO: Display already disabled message
          await client.disabledCommands.update({ guildId }, { commands: [...cachedDisabledCommands.commands, targetCommand] });
        }
        break;
      default:
    }

    cmd.reply({
      content: "Check console",
    });
  },
};
