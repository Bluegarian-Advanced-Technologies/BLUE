const { embedMessage } = require("../../utils");

function findTextCommand(client, cmd) {
  const query = client.BACH.commands.get(cmd);
  if (query?.alias) return client.BACH.commands.get(query.cmdName);
  return query;
}

function checkCommandExists(client, isInteraction, targetCommand) {
  if (isInteraction) {
    command = client.BACH.commands.get(targetCommand.toLowerCase());
    if (command == null) false;
  } else {
    command = findTextCommand(client, targetCommand);
    if (command == null) return false;
  }
  return true;
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
              value: "res",
            },
            {
              name: "Unrestrict",
              value: "unres",
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
          name: "_action",
          description: "Add or remove role for command to require",
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
          type: "String",
          name: "command_",
          description: "Targeted command",
          required: true,
        },
      ],
    },
  ],

  permissions: ["ManageGuild"],

  execute: async (cmd, { client, guildId, isInteraction, subcommand, embedReply, args }) => {
    switch (subcommand) {
      case "toggle": {
        const targetCommand = args[1].toLowerCase();

        if (!checkCommandExists(client, isInteraction, targetCommand)) return await embedReply("Command non-existent", null, "warn");

        let command;

        if (isInteraction) {
          command = client.BACH.commands.get(targetCommand.toLowerCase());
          if (!command) return await embedReply("Command non-existent", null, "warn");
        } else {
          command = findTextCommand(client, targetCommand);
          if (!command) return await embedReply("Command non-existent", null, "warn");
        }

        if (command.disableExempted) return await embedReply("Cannot disable command", "This command is exempted from being disabled.", "error");

        const cachedServer = client.BACH.disabledCommands.getAll().find((doc) => doc.guildId === guildId);

        switch (args[0]) {
          case "on":
            if (!cachedServer || !cachedServer.commands.includes(targetCommand))
              return await embedReply("Command not disabled", "Cannot enable already enabled command", "warn");

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
              await embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
            } else {
              if (cachedServer.commands.includes(targetCommand))
                return await embedReply("Command already disabled", "Cannot disable already disabled command", "warn");
              client.BACH.disabledCommands.update({ guildId }, { $push: { commands: targetCommand } }, (servers) => {
                servers.find((server) => server.guildId === guildId).commands.push(targetCommand);
              });

              await embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
            }
            break;
          default:
            reply("bruh");
        }

        break;
      }

      case "channelonly": {
        let command;

        let dynamicChannel;

        if (isInteraction) {
          dynamicChannel = args[1].id;
          if (!args[1].isTextBased())
            return await embedReply(
              "Not a Text Channel",
              "Channel categories are not supported yet, please select a text channel based channel instead.",
              "warn"
            );
        } else {
          dynamicChannel = args[1][1];
        }
        const targetChannel = dynamicChannel;
        const targetCommand = args[2].toLowerCase();

        if (isInteraction) {
          command = client.BACH.commands.get(targetCommand.toLowerCase());
          if (!command) return await embedReply("Command non-existent", null, "warn");
        } else {
          command = findTextCommand(client, targetCommand);
          if (!command) return await embedReply("Command non-existent", null, "warn");
        }

        if (command.disableExempted)
          return await embedReply("Cannot restrict command", "This command is exempted from being restricted for saftey purposes.", "error");

        if (!checkCommandExists(client, isInteraction, targetCommand)) return await embedReply("Command non-existent", null, "warn");

        if (isInteraction && client.BACH.commands.get(targetCommand) == null) {
          return await embedReply("Command non-existent");
        } else if (findTextCommand(client, targetCommand) == null) return await embedReply("Command non-existent");

        const cachedServer = client.BACH.restrictedChannels.getAll().find((server) => server.guildId === guildId);

        switch (args[0]) {
          case "unres": {
            if (cachedServer == null) return await embedReply("No restricted command channels", null, "warn");

            client.BACH.restrictedChannels.update(
              null,
              null,
              (cache) => {
                const server = cache.find((server) => server.guildId === guildId);
                const commands = server.commands;

                for (const command of commands) {
                  if (command.command === targetCommand) {
                    if (!command.channels.includes(targetChannel))
                      return embedReply("Command not restricted", "This command is not restricted to this channel yet.", "warn");
                    for (let i = 0; i < command.channels.length; ++i) {
                      if (command.channels[i] === targetChannel) {
                        command.channels.splice(i, 1);

                        server.markModified("commands");
                        server.save();

                        embedReply("Successfully completed", `Unrestricted *${targetCommand}* from <#${targetChannel}>.`, "ok");
                        return;
                      }
                    }
                  }
                }
              },
              true
            );
            break;
          }
          case "res": {
            if (cachedServer == null) {
              client.BACH.restrictedChannels.set({
                guildId,
                commands: [
                  {
                    command: targetCommand,
                    channels: [targetChannel],
                  },
                ],
              });
              await embedReply("Successfully completed", `Restricted *${targetCommand}* to <#${targetChannel}>.`, "ok");
            } else {
              client.BACH.restrictedChannels.update(
                null,
                null,
                (cache) => {
                  const server = cache.find((server) => server.guildId === guildId);
                  const commands = server.commands;

                  for (const command of commands) {
                    if (command.command === targetCommand) {
                      if (command.channels.includes(targetChannel))
                        return embedReply("Command already restricted", "This command is already restricted to the channel.", "warn");
                      command.channels.push(targetChannel);

                      server.markModified("commands");
                      server.save();

                      embedReply("Successfully completed", `Restricted *${targetCommand}* to <#${targetChannel}>.`, "ok");

                      return;
                    }
                  }

                  client.BACH.restrictedChannels.update({ guildId }, { $push: { commands: { command: targetCommand, channels: [targetChannel] } } }, () => {
                    commands.push({ command: targetCommand, channels: [targetChannel] });
                  });

                  embedReply("Successfully completed", `Restricted *${targetCommand}* to <#${targetChannel}>.`, "ok");
                },
                true
              );
            }
          }
        }
        break;
      }

      case "requiredrole": {
        let dynamicRole;

        if (isInteraction) {
          dynamicRole = args[0].id;
        } else {
          dynamicRole = args[0][1];
        }

        const targetRole = dynamicRole;
        const targetCommand = args[2].toLowerCase();

        if (!checkCommandExists(client, isInteraction, targetCommand)) return await embedReply("Command non-existent", null, "warn");

        const cachedServer = client.BACH.restrictedRoles.getAll().find((server) => server.guildId === guildId);

        switch (args[1]) {
          case "add": {
            if (cachedServer == null) {
              client.BACH.restrictedRoles.set({
                guildId,
                commands: [
                  {
                    command: targetCommand,
                    roles: [targetRole],
                  },
                ],
              });
            } else {
              client.BACH.restrictedRoles.update(
                null,
                null,
                (cache) => {
                  const server = cache.find((server) => server.guildId === guildId);
                  const commands = server.commands;

                  const command = commands.find((cmd) => cmd.command === targetCommand);

                  if (command != null && command.roles.includes(targetRole))
                    return embedReply("Command already restricted to role", `This command already includes <@&${targetRole}>`, "warn");

                  if (command != null) {
                    command.roles.push(targetRole);
                  } else {
                    commands.push({
                      command: targetCommand,
                      roles: [targetRole],
                    });
                  }

                  server.markModified("commands");
                  server.save();

                  embedReply("Successfully completed", `Command *${targetCommand}* now requires <@&${targetRole}>`, "ok");
                },
                true
              );
            }

            break;
          }
          case "remove": {
            if (cachedServer == null) return await embedReply("No restricted command roles", null, "warn");

            client.BACH.restrictedRoles.update(
              null,
              null,
              (cache) => {
                const server = cache.find((server) => server.guildId === guildId);
                const commands = server.commands;

                const command = commands.find((cmd) => cmd.command === targetCommand);

                if (command == null) return embedReply("Command not role restricted", "This command is not role restricted yet.", "warn");
                if (!command.roles.includes(targetRole))
                  return embedReply("Command not restricted to role", `This command is not restricted to role <@&${targetRole}> yet.`, "warn");

                for (let i = 0; i < command.roles.length; i++) {
                  const role = command.roles[i];

                  if (targetRole === role) {
                    command.roles.splice(i, 1);
                    break;
                  }
                }

                server.markModified("commands");
                server.save();

                embedReply("Successfully completed", `Command *${targetCommand}* no longer requires <@&${targetRole}>`, "ok");
              },
              true
            );
          }
        }
      }
    }
  },
};
