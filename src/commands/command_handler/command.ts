import { ApplicationCommandOptionType, Channel, Role } from "discord.js";
import Command from "../../classes/Command";

interface RestrictedRoleCommand {
  command: string;
  roles: string[];
}

export default new Command({
  id: "command",
  description: "Enable or disable commands",
  category: "Moderation",
  slash: "both",
  aliases: [],
  disableExempted: true,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "toggle",
      description: "Toggle command on/off in server",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "action",
          description: "Enable or disable command",
          choices: [
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
          type: ApplicationCommandOptionType.String,
          name: "command",
          description: "Targeted command",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "channelonly",
      description: "Restrict command to certain channel(s)",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "operation",
          description: "Restrict/unrestrict command to channel",
          required: true,
          choices: [
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
          type: ApplicationCommandOptionType.Channel,
          name: "channel",
          description: "Channel to restrict command to",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "command",
          description: "Targeted command",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "requiredrole",
      description: "Restrict command to certain role(s)",
      options: [
        {
          type: ApplicationCommandOptionType.Role,
          name: "role",
          description: "Role for command to require",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "action",
          description: "Add or remove role for command to require",
          required: true,
          choices: [
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
          type: ApplicationCommandOptionType.String,
          name: "command",
          description: "Targeted command",
          required: true,
        },
      ],
    },
  ],

  permissions: ["ManageGuild"],
}, async (client, context) => {
  switch (context.subcommand) {
    case "toggle": {
      const targetCommand = (context.options[1] as string).toLowerCase();

      if (!client.bach.checkCommandExists(context.isInteractionBased(), targetCommand)) return await context.embedReply("Command non-existent", undefined, "warn");

      let command;

      if (context.isInteractionBased()) {
        command = client.bach.commands.get(targetCommand.toLowerCase());
        if (!(command instanceof Command)) return await context.embedReply("Command non-existent", undefined, "warn");
      } else {
        command = client.bach.findTextCommand(targetCommand);
        if (!command) return await context.embedReply("Command non-existent", undefined, "warn");
      }

      if (command.disableExempted) return await context.embedReply("Cannot disable command", "This command is exempted from being disabled.", "error");

      const cachedServer = client.bach.disabledCommands.getAll().find((doc) => doc.guildId === context.guild.id);

      switch (context.options[0]) {
        case "on":
          if (!cachedServer || !cachedServer.commands.includes(targetCommand))
            return await context.embedReply("Command not disabled", "Cannot enable already enabled command", "warn");

          const commands = cachedServer.commands;
          for (let i = 0; i < commands.length; ++i) {
            if (commands[i] === targetCommand) {
              commands.splice(i, 1);
              break;
            }
          }

          await client.bach.disabledCommands.update({ guildId: context.guild.id }, { commands });
          
          await context.embedReply(`Command '${targetCommand}' enabled`, "Successfully enabled command", "ok");

          break;
        case "off":
          if (!cachedServer) {
            client.bach.disabledCommands.set({
              guildId: context.guild.id,
              commands: [targetCommand],
            });
            await context.embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
          } else {
            if (cachedServer.commands.includes(targetCommand))
              return await context.embedReply("Command already disabled", "Cannot disable already disabled command", "warn");
            const commands = cachedServer.commands;
            commands.push(targetCommand);
            await client.bach.disabledCommands.update({ guildId: context.guild.id }, { commands });

            await context.embedReply(`Command '${targetCommand}' disabled`, "Successfully disabled command", "ok");
          }
          break;
      }

      break;
    }

    case "channelonly": {
      let command;

      const channel = context.options[1] as Channel;
      if (!channel.isTextBased()) {
        return await context.embedReply(
          "Not a Text Channel",
          "Channel categories are not supported yet, please select a text channel based channel instead.",
          "warn"
        );
      }
      const targetChannel = channel.id;
      const targetCommand = (context.options[2] as string).toLowerCase();

      if (context.isInteractionBased()) {
        command = client.bach.commands.get(targetCommand.toLowerCase());
        if (!(command instanceof Command)) return await context.embedReply("Command non-existent", undefined, "warn");
      } else {
        command = client.bach.findTextCommand(targetCommand);
        if (!command) return await context.embedReply("Command non-existent", undefined, "warn");
      }

      if (command.disableExempted)
        return await context.embedReply("Cannot restrict command", "This command is exempted from being restricted for saftey purposes.", "error");

      if (!client.bach.checkCommandExists(context.isInteractionBased(), targetCommand)) return await context.embedReply("Command non-existent", undefined, "warn");

      if (context.isInteractionBased() && client.bach.commands.get(targetCommand) == null) {
        return await context.embedReply("Command non-existent");
      } else if (client.bach.findTextCommand(targetCommand) == null) return await context.embedReply("Command non-existent");

      const cachedServer = client.bach.restrictedChannels.getAll().find((server) => server.guildId === context.guild.id);

      switch (context.options[0]) {
        case "unres": {
          if (cachedServer == null) return await context.embedReply("No restricted command channels", undefined, "warn");
          const commands = cachedServer.commands;

          for (const command of commands) {
            if (command.command === targetCommand) {
              if (!command.channels.includes(targetChannel))
                return await context.embedReply("Command not restricted", "This command is not restricted to this channel yet.", "warn");
              for (let i = 0; i < command.channels.length; ++i) {
                if (command.channels[i] === targetChannel) {
                  command.channels.splice(i, 1);
                  await client.bach.restrictedChannels.update({ guildId: context.guild.id }, { commands });
                  return await context.embedReply("Successfully completed", `Unrestricted *${targetCommand}* from <#${targetChannel}>.`, "ok");
                }
              }
            }
          }
          await context.embedReply("Command not restricted", "This command is not restricted to this channel yet.", "warn");
          break;
        }
        case "res": {
          if (cachedServer == null) {
            await client.bach.restrictedChannels.set({
              guildId: context.guild.id,
              commands: [
                {
                  command: targetCommand,
                  channels: [targetChannel],
                },
              ],
            });
            await context.embedReply("Successfully completed", `Restricted *${targetCommand}* to <#${targetChannel}>.`, "ok");
          } else {
            const commands = cachedServer.commands;

            for (const command of commands) {
              if (command.command === targetCommand) {
                if (command.channels.includes(targetChannel))
                  return await context.embedReply("Command already restricted", "This command is already restricted to the channel.", "warn");
                command.channels.push(targetChannel);
                await client.bach.restrictedChannels.update({ guildId: context.guild.id }, { commands });
                return await context.embedReply("Successfully completed", `Restricted *${targetCommand}* to <#${targetChannel}>.`, "ok");
              }
            }

            commands.push({ command: targetCommand, channels: [targetChannel] });

            await client.bach.restrictedChannels.update({ guildId: context.guild.id }, { commands });

            await context.embedReply("Successfully completed", `Restricted *${targetCommand}* to <#${targetChannel}>.`, "ok");
          }
        }
      }
      break;
    }

    case "requiredrole": {
      const targetRole = (context.options[0] as Role).id;
      const targetCommand = (context.options[2] as string).toLowerCase();

      if (!client.bach.checkCommandExists(context.isInteractionBased(), targetCommand)) return await context.embedReply("Command non-existent", undefined, "warn");

      const cachedServer = client.bach.restrictedRoles.getAll().find((server) => server.guildId === context.guild.id);

      switch (context.options[1]) {
        case "add": {
          if (cachedServer == null) {
            client.bach.restrictedRoles.set({
              guildId: context.guild.id,
              commands: [
                {
                  command: targetCommand,
                  roles: [targetRole],
                },
              ],
            });
          } else {
            const commands = cachedServer.commands;

            const command = commands.find((cmd: RestrictedRoleCommand) => cmd.command === targetCommand);

            if (command != null && command.roles.includes(targetRole))
              return context.embedReply("Command already restricted to role", `This command already includes <@&${targetRole}>`, "warn");

            if (command != null) {
              command.roles.push(targetRole);
            } else {
              commands.push({
                command: targetCommand,
                roles: [targetRole],
              });
            }

            await client.bach.restrictedRoles.update({ guildId: context.guild.id }, { commands });
            await context.embedReply("Successfully completed", `Command *${targetCommand}* now requires <@&${targetRole}>`, "ok");
          }

          break;
        }
        case "remove": {
          if (cachedServer == null) return await context.embedReply("No restricted command roles", undefined, "warn");

          const commands = cachedServer.commands;

          const command = commands.find((cmd: RestrictedRoleCommand) => cmd.command === targetCommand);

          if (command == null) return context.embedReply("Command not role restricted", "This command is not role restricted yet.", "warn");
          if (!command.roles.includes(targetRole))
            return context.embedReply("Command not restricted to role", `This command is not restricted to role <@&${targetRole}> yet.`, "warn");

          for (let i = 0; i < command.roles.length; i++) {
            const role = command.roles[i];

            if (targetRole === role) {
              command.roles.splice(i, 1);
              break;
            }
          }

          await client.bach.restrictedRoles.update({ guildId: context.guild.id }, { commands });
          await context.embedReply("Successfully completed", `Command *${targetCommand}* no longer requires <@&${targetRole}>`, "ok");
        }
      }
    }
  }
});
