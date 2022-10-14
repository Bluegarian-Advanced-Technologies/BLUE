import { ApplicationCommandOptionData, ApplicationCommandOptionType, PermissionsBitField } from "discord.js";

import Client from "./Client";
import { Context } from "./Context";

interface CommandOptions {
    id: string;
    description: string;
    category: string;
    aliases: string[];
    slash: boolean | "both";
    options: ApplicationCommandOptionData[];
    cooldown?: number;
    disableExempted?: boolean;
    elevation?: number;
    hidden?: boolean;
    permissions?: (keyof typeof PermissionsBitField.Flags)[];
}

class Command {
    id: string;
    description: string;
    category: string;
    aliases: string[];
    permissions: (keyof typeof PermissionsBitField.Flags)[];
    slash: boolean | "both";
    options: ApplicationCommandOptionData[];
    cooldown: number;
    elevation: number;
    disableExempted: boolean;
    hidden: boolean;
    
    execute: (client: Client, context: Context) => Promise<unknown>;
    
    readonly alias = false;

    constructor(options: CommandOptions, execute: (client: Client, context: Context) => Promise<unknown>) {
        this.id = options.id;
        this.description = options.description;
        this.category = options.category;
        this.aliases = options.aliases;
        this.permissions = options.permissions ?? [];
        this.cooldown = options.cooldown ?? 1;
        this.elevation = options.elevation ?? 1;
        this.disableExempted = options.disableExempted ?? false;
        this.slash = options.slash;
        this.hidden = options.hidden ?? false;
        this.options = options.options;
        this.execute = execute;
    }

    get hasSubcommands() {
        return this.options.length === 0 ? false : this.options.every(option => 
            option.type === ApplicationCommandOptionType.Subcommand || 
            option.type === ApplicationCommandOptionType.SubcommandGroup
        );
    }
}

export default Command;
