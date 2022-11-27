import { ApplicationCommandAutocompleteNumericOptionData, ApplicationCommandAutocompleteStringOptionData, ApplicationCommandChannelOptionData, ApplicationCommandNonOptionsData, ApplicationCommandOptionData, ApplicationCommandStringOptionData, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, ChatInputApplicationCommandData, ClientEvents, Collection, GuildBasedChannel, PermissionsBitField, Role, User } from "discord.js";

import disabledCommands from "../models/disabledCommands";
import disabledEvents from "../models/disabledEvents";
import restrictedChannels from "../models/restrictedChannels";
import restrictedRoles from "../models/restrictedRoles";
import servers from "../models/servers";
import users from "../models/users";
import { importDefault } from "../utilities";

import Client from "./Client";
import Command from "./Command";
import CommandCooldownHandler from "./CommandCooldownHandler";
import { Context } from "./Context";
import Event from "./Event";
import LiveCollection from "./LiveCollection";
import ServerManager from "./ServerManager";

const permissionsList = Object.keys(PermissionsBitField.Flags);

interface Alias {
  id: string;
  target: string;
  alias: true;
}

export interface RestrictedRoleCommand {
  command: string;
  roles: string[];
}

export interface RestrictedChannelCommand {
  command: string;
  channels: string[];
}

export type OptionType = GuildBasedChannel | User | Role | number | string | boolean | undefined;

export type ApplicationCommandPrimitiveData = Exclude<ApplicationCommandOptionData, ApplicationCommandNonOptionsData | ApplicationCommandSubGroupData | ApplicationCommandSubCommandData | ApplicationCommandChannelOptionData | ApplicationCommandAutocompleteNumericOptionData | ApplicationCommandAutocompleteStringOptionData>;

class BACH {
  client: Client;

  commands = new Collection<string, Alias | Command>();
  commandCooldowns = new CommandCooldownHandler();
  events = new Collection<string, Event<keyof ClientEvents>>();

  disabledCommands = new LiveCollection(disabledCommands);
  disabledEvents = new LiveCollection(disabledEvents);
  users = new LiveCollection(users);
  restrictedChannels = new LiveCollection(restrictedChannels);
  restrictedRoles = new LiveCollection(restrictedRoles);

  servers: ServerManager;

  constructor(client: Client) {
    this.client = client;
    this.servers = new ServerManager(this.client, new LiveCollection(servers));
  }

  async initialize() {
    await this.disabledCommands.initialize();
    await this.disabledEvents.initialize();
    await this.users.initialize();
    await this.servers.data.initialize();
    await this.restrictedChannels.initialize();
    await this.restrictedRoles.initialize();
  }

  async registerCommand(path: string): Promise<Command> {
    const command = await importDefault(path) as Command;

    if (command.id === "help") {
      const commands = Array.from(this.commands.values()).filter(c => c instanceof Command && !c.hidden) as Command[];
      const knownCategories = new Set(commands.map(c => c.category));

      for (const category of knownCategories) {
        (command.options[0] as ApplicationCommandStringOptionData).choices!.push({
          name: category,
          value: category,
        });
      }
    }

    if (command.permissions) {
      for (let i = 0; i < command.permissions.length; i++) {
        const permission = command.permissions[i];
        if (!permissionsList.includes(permission))
          throw new Error(`Invalid permission ${permission} at command ${command.id}`);
      }
    }

    for (let i = 0; i < command.aliases.length; i++) {
      const alias = command.aliases[i];

      this.commands.set(alias, {
        alias: true,
        id: alias,
        target: command.id,
      });
    }

    this.commands.set(command.id, command);

    return command;
  }

  async updateApplicationCommands(guild?: string | string[]) {
    const commands = Array.from(this.commands.values()).map(c => c instanceof Command && c.slash ? c : null).filter(c => c) as Command[];
    const commandOptions = commands.map(c => {
      const commandData: ChatInputApplicationCommandData = {
        name: c.id,
        description: c.description,
        options: c.options,
      };
      return commandData;
    });
    if (process.env.NODE_ENV === "production") {
      await this.client.application?.commands.set(commandOptions);
    } else {
      if (typeof guild === "string") {
        await this.client.application?.commands.set(commandOptions, guild);
      } else if (Array.isArray(guild)) {
        for (let i = 0; i < guild.length; i++) {
          await this.client.application?.commands.set(commandOptions, guild[i]);
        }
      } else {
        await this.client.application?.commands.set(commandOptions);
      }
    }
  }

  async runCommandChecks(command: Command, context: Context) {
    const user = this.client.bach.users.getAll().find((userObj) => userObj.userId === context.user.id);

    if (this.commandCooldowns.validate(context.user.id, context.guild.id)) {
      const reply = await context.embedReply(
        "Command on cooldown",
        `You must wait ${this.client.bach.commandCooldowns.get(context.user.id, context.guild.id)}s before using that again`,
        "warn"
      );
      setTimeout(() => {
        reply?.delete().catch(() => {});
      }, 5000);
      return;
    }

    if (user?.elevation === 0) return await context.embedReply("You are banned", `You have been blacklisted from using BLUE.`, "error");

    if (command.elevation > (user?.elevation || 1))
      return await context.embedReply("Access Denied", `Level ${command.elevation} clearance required.`, "error");

    const guildDisabledCommands = this.disabledCommands.getAll().find((doc) => doc.guildId === context.guild.id);
    if (guildDisabledCommands != null && guildDisabledCommands.commands.includes(command.id) && context.user.id !== this.client.application!.owner!.id)
      return await context.embedReply("Command Disabled", "This command is disabled in the server", "error");

    if (
      command.permissions != null &&
      !command.permissions.every((flag) => context.channel.permissionsFor(context.member).has(PermissionsBitField.Flags[flag])) &&
      context.user.id !== this.client.application!.owner!.id
    ) 
      return await context.embedReply("Invalid Permissions", `You require \`${command.permissions.join(", ")}\` permissions to run this command`, "error");

    const restrictedRoles = this.restrictedRoles.getAll().find((doc) => doc.guildId === context.guild.id);
    
    const restrictedRolesCommands = restrictedRoles?.commands as RestrictedRoleCommand[] | undefined;
    const restrictedRolesCommand = restrictedRolesCommands?.find((c) => c.command === command.id);

    if (
      restrictedRoles != null &&
      restrictedRolesCommand != null &&
      !restrictedRolesCommand.roles.every((role) => context.member.roles.cache.has(role)) &&
      context.user.id !== this.client.application!.owner!.id
    )
      return await context.embedReply(
        "Insufficient roles",
        `You require the following roles to use this command: ${restrictedRolesCommand.roles.reduce((total, value) => {
          return total + "\n<@&" + value + ">";
        }, "\n")}`,
        "error"
      );

    const restrictedChannel = this.restrictedChannels.getAll().find((doc) => doc.guildId === context.guild.id);
    
    const restrictedChannelCommands = restrictedChannel?.commands as RestrictedChannelCommand[] | undefined;
    const restrictedChannelCommand = restrictedChannelCommands?.find((cmd) => cmd.command === command.id);

    if (
      restrictedChannel != null &&
      restrictedChannelCommand != null &&
      !restrictedChannelCommand?.channels.includes(context.channel.id) &&
      context.user.id !== this.client.application!.owner!.id
    )
      return await context.embedReply(
        "Command restricted",
        `This command can only be run in the following channels: ${restrictedChannelCommand.channels.reduce((total, value) => {
          return total + "\n<#" + value + ">";
        }, "\n")}`,
        "error"
      );
  }
}

export default BACH;
