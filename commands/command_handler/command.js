const { embedMessage } = require("../../utils");

function findTextCommand(client, cmd) {
  const query = client.BACH.commands.get(cmd);
  if (query?.alias) return client.BACH.commands.get(query.cmdName);
  return query;
}

module.exports = {
  id: "command",
  description: "Enable or disable commands",
  category: "Moderation",
  slash: "both",
  aliases: [],
  disableExempted: true,
  expectedArgs: [
    {
      type: "Subcommand",
      name: "toggle",
      description: "Toggle command on/off in server",
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
    },
    {
      type: "Subcommand",
      name: "channelonly",
      description: "Restrict command to certain channel(s)",
      expectedArgs: [
        {
          type: "String",
          name: "operation",
          description: "Restrict/unrestrict command to channel",
          required: true,
          options: [
            {
              name: "Restrict",
              value: "off",
            },
            {
              name: "Unrestrict",
              value: "on",
            },
          ],
        },
        {
          type: "Channel",
          name: "channel",
          description: "Channel to restrict command to",
          required: true,
        },
        {
          type: "String",
          name: "_command",
          description: "Targeted command",
          required: true,
        },
      ],
    },
    {
      type: "Subcommand",
      name: "requiredrole",
      description: "Restrict command to certain role(s)",
      expectedArgs: [
        {
          type: "Role",
          name: "role",
          description: "Role for command to require",
          required: true,
        },
        {
          type: "String",
          name: "command_",
          description: "Targeted command",
          required: true,
        },
      ],
    },
  ],

  permissions: ["MANAGE_GUILD"],

  execute: async (cmd, { client, guildId, isInteraction, subcommand, embedReply, args }) => {
    switch (subcommand) {
      case "toggle": {
        const targetCommand = args[1].toLowerCase();

        let command;

        if (isInteraction) {
          command = client.BACH.commands.get(targetCommand.toLowerCase());
          if (!command) return embedReply("Command non-existent", null, "warn");
        } else {
          command = findTextCommand(client, targetCommand);
          if (!command) return embedReply("Command non-existent", null, "warn");
        }

        if (command.disableExempted) return embedReply("Cannot disable command", "This command is exempted from being disabled.", "error");

        const cachedServer = client.BACH.disabledCommands.getAll().find((doc) => doc.guildId === guildId);

        switch (args[0]) {
          case "on":
            if (!cachedServer || !cachedServer.commands.includes(targetCommand))
              return embedReply("Command not disabled", "Cannot enable already enabled command", "warn");

            client.BACH.disabledCommands.update({ guildId }, { $pull: { commands: targetCommand } }, (servers) => {
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
              client.BACH.disabledCommands.set({
                guildId,
                commands: [targetCommand],
              });
              embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
            } else {
              if (cachedServer.commands.includes(targetCommand))
                return embedReply("Command already disabled", "Cannot disable already disabled command", "warn");
              client.BACH.disabledCommands.update({ guildId }, { $push: { commands: targetCommand } }, (servers) => {
                servers.find((server) => server.guildId === guildId).commands.push(targetCommand);
              });

              embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
            }
            break;
          default:
            reply("bruh");
        }
      }

      case "channelonly": {
        let dynamicChannel;

        if (isInteraction) {
          dynamicChannel = args[1].id;
        } else {
          dynamicChannel = args[1][1];
        }

        const targetChannel = dynamicChannel;
        const targetCommand = args[2].toLowerCase();

        if (isInteraction && client.BACH.commands.get(targetCommand) == null) {
          return embedReply("Command non-existent");
        } else if (findTextCommand(client, targetCommand) == null) return embedReply("Command non-existent");

        const cachedServer = client.BACH.restrictedChannels.getAll().find((server) => server.guildId === guildId);

        switch (args[0]) {
          case "on": {
            if (cachedServer == null) return embedReply("No restricted command channels", null, "warn");

            client.BACH.restrictedChannels.update({ guildId, channels: { $elemMatch: {} } }, { $pull: { "channels.$.commands": targetCommand } }, (cache) => {
              const channels = cache.find((server) => server.guildId === guildId).channels;

              for (const channel of channels) {
                if (channel.channel === targetChannel) {
                  for (let i = 0; i < channel.commands.length; ++i) {
                    if (channel.commands[i] === targetCommand) {
                      channel.commands.splice(i, 1);
                      break;
                    }
                  }
                  return;
                }
              }
            });
          }

          case "off": {
            if (cachedServer == null) {
              client.BACH.restrictedChannels.set({
                guildId,
                channels: [
                  {
                    channel: targetChannel,
                    commands: [targetCommand],
                  },
                ],
              });
            } else {
              client.BACH.restrictedChannels.update(
                { guildId, "channels.$.channel": targetChannel },
                { $push: { "channels.$.commands": targetCommand } },
                (cache) => {
                  const channels = cache.find((server) => server.guildId === guildId).channels;

                  for (const channel of channels) {
                    if (channel.channel === targetChannel) {
                      return channel.commands.push(targetCommand);
                    }
                  }

                  client.BACH.restrictedChannels.update({ guildId }, { $push: { channels: { channel: targetChannel, commands: [targetCommand] } } }, () => {
                    channels.push({ channel: targetChannel, commands: [targetCommand] });
                  });
                }
              );
            }
          }
        }
      }

      case "requiredrole": {
      }
    }
  },
};
