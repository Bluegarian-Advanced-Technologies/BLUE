const { embedMessage } = require("../../utils");

function findTextCommand(client, cmd) {
  const query = client.commands.get(cmd);
  if (query?.alias) return client.commands.get(query.cmdName);
  return query;
}

module.exports = {
  id: "command",
  description: "Enable or disable commands",
  category: "Moderation",
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

  execute: async (cmd, { client, guildId, isInteraction, channel, embedReply, args }) => {
    const targetCommand = args[1];

    if (isInteraction) {
      if (!client.commands.get(targetCommand)) return embedReply("Command non-existent", null, "warn");
    } else {
      if (!findTextCommand(client, targetCommand)) return embedReply("Command non-existent", null, "warn");
    }

    const cachedServer = client.disabledCommands.getAll().find((doc) => doc.guildId === guildId);

    switch (args[0]) {
      case "on":
        if (!cachedServer || !cachedServer.commands.includes(targetCommand))
          return embedReply("Command not disabled", "Cannot enable already enabled command", "warn");

        client.disabledCommands.update({ guildId }, { $pull: { commands: targetCommand } }, (servers) => {
          const targetServer = servers.find((server) => server.guildId === guildId);

          for (let i = 0; i < targetServer.commands.length; ++i) {
            if (targetServer.commands[i] === targetCommand) {
              targetServer.commands.splice(i, 1);
              break;
            }
          }

          embedReply(`Command '${targetCommand}' enabled`, "Successfully enabled command", "ok");
        });

        break;
      case "off":
        if (!cachedServer) {
          client.disabledCommands.set({
            guildId,
            commands: [targetCommand],
          });
        } else {
          if (cachedServer.commands.includes(targetCommand)) return embedReply("Command already disabled", "Cannot disable already disabled command", "warn");
          client.disabledCommands.update({ guildId }, { $push: { commands: targetCommand } }, (servers) => {
            servers.find((server) => server.guildId === guildId).commands.push(targetCommand);
          });

          embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
        }
        break;
      default:
        reply("bruh");
    }
  },
};
