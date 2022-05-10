const utils = require("../../utils");

function findTextCommand(client, cmd) {
  const query = client.commands.get(cmd);
  if (query?.alias) return client.commands.get(query.cmdName);
  return query;
}

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
      description: "Targeted command",
      required: true,
    },
  ],

  permissions: ["MANAGE_GUILD"],

  execute: async (cmd, { client, guildId, isInteraction, channel, reply, args }) => {
    const targetCommand = args[1];

    if (isInteraction) {
      if (!client.commands.get(targetCommand)) return reply("Command non-existent");
    } else {
      if (!findTextCommand(client, targetCommand)) return reply("Command non-existent");
    }

    const cachedServer = client.disabledCommands.getAll().find((doc) => doc.guildId === guildId);

    switch (args[0]) {
      case "on":
        if (!cachedServer || !cachedServer.commands.includes(targetCommand)) return channel.send("Command not disabled yet"); // TODO: Display not disabled message

        client.disabledCommands.update({ guildId, $pull: { commands: targetCommand } }, (servers) => {
          const targetServer = servers.find((server) => server.guildId === guildId);

          for (let i = 0; i < targetServer.commands.length; ++i) {
            if (targetServer.commands[i] === targetCommand) {
              targetServer.commands.splice(i, 1);
              break;
            }
          }
        });

        break;
      case "off":
        if (!cachedServer) {
          client.disabledCommands.set({
            guildId,
            commands: [targetCommand],
          });
        } else {
          if (cachedServer.commands.includes(targetCommand)) return channel.send("Command already disabled"); // TODO: Display already disabled message
          client.disabledCommands.update({ guildId, $push: { commands: targetCommand } }, (servers) => {
            servers.find((server) => server.guildId === guildId).commands.push(targetCommand);
          });
        }
        break;
      default:
    }

    cmd.reply({
      content: "Check console",
    });
  },
};
