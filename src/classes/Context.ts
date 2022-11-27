import { BaseMessageOptions, CommandInteraction, Guild, GuildMember, GuildTextBasedChannel, Message, PermissionsBitField, User } from "discord.js";
import { ErrorLevel, embedMessage } from "../utilities";
import Client from "./Client";

interface CommandData {
    subcommand?: string;
    options: unknown[];
}

export abstract class Context {
    abstract readonly client: Client;
    abstract readonly createdTimestamp: number;
    abstract readonly channel: GuildTextBasedChannel;
    abstract readonly guild: Guild;
    abstract readonly member: GuildMember;
    abstract readonly user: User;

    abstract readonly interactionBased: boolean;

    abstract readonly subcommand?: string;
    abstract readonly options: unknown[];

    static create(client: Client, object: CommandInteraction | Message, command: CommandData): Context {
        if (object instanceof CommandInteraction) {
            if (!object.guild) throw new Error("CommandInteraction must be in a guild");
            return new ApplicationCommandContext(client, object, command);
        }
        if (object instanceof Message) {
            if (!object.guild) throw new Error("Message must be in a guild");
            return new MessageContext(client, object, command);
        }
        throw new TypeError("Invalid context object");
    };

    isTextBased(): this is MessageContext {
        return !this.interactionBased;
    };

    isInteractionBased(): this is ApplicationCommandContext {
        return this.interactionBased;
    };

    abstract reply(content: string | BaseMessageOptions, ephemeral?: boolean): Promise<Message>;
   
    abstract embedReply(
        title: string, 
        text?: string, 
        status?: ErrorLevel, 
        ephemeral?: boolean, 
        options?: Omit<BaseMessageOptions, "embeds" | "ephemeral" | "fetchReply">
    ): Promise<Message>;
}

export class ApplicationCommandContext extends Context {
    client: Client;
    createdTimestamp: number;
    // options: CommandInteraction["options"];
    channel: GuildTextBasedChannel;
    guild: Guild;
    member: GuildMember;
    user: User;

    interaction: CommandInteraction;
    interactionBased = true;

    subcommand?: string;
    options: unknown[];

    constructor(client: Client, interaction: CommandInteraction, command: CommandData) {
        super();
        this.client = client;
        this.interaction = interaction;

        this.createdTimestamp = interaction.createdTimestamp;
        this.channel = interaction.channel as GuildTextBasedChannel;
        this.guild = interaction.guild as Guild;
        this.member = interaction.member as GuildMember;
        this.user = interaction.user;

        this.subcommand = command.subcommand;
        this.options = command.options;
    }

    async reply(content: string | BaseMessageOptions, ephemeral = false) {
        if (typeof content === "string") content = { content };
        content.content = content.content ? content.content.substring(0, 2000) : undefined;
  
        return await this.interaction.reply({
            ...content,
            ephemeral,
            fetchReply: true,
        });
    }
    
    async embedReply(
        title: string, 
        text?: string, 
        status?: ErrorLevel, 
        ephemeral = false, 
        options: Omit<BaseMessageOptions, "embeds"> = {}
    ) {
        return await this.interaction.reply({
            embeds: [embedMessage(title, text, status)],
            ephemeral,
            fetchReply: true,
            ...options,
        });
    }
}

export class MessageContext extends Context {
    client: Client;
    createdTimestamp: number;
    channel: GuildTextBasedChannel;
    guild: Guild;
    member: GuildMember;
    user: User;

    message: Message;
    interactionBased = false;

    subcommand?: string;
    options: unknown[];

    constructor(client: Client, message: Message, command: CommandData) {
        super();
        this.client = client;
        this.message = message;

        this.createdTimestamp = message.createdTimestamp;
        this.channel = message.channel as GuildTextBasedChannel;
        this.guild = message.guild as Guild;
        this.member = message.member as GuildMember;
        this.user = message.author;

        this.subcommand = command.subcommand;
        this.options = command.options;
    }

    // https://www.youtube.com/watch?v=9jK-NcRmVcw
    // https://www.youtube.com/watch?v=HGl75kurxok

    async reply(content: string | BaseMessageOptions, _ephemeral = false) {
        if (this.guild.members.me && !this.channel.permissionsFor(this.guild.members.me).has([PermissionsBitField.Flags.SendMessages])) 
            throw new Error("Missing permissions");

        if (typeof content === "string") content = { content };
        content.content = content.content ? content.content.substring(0, 2000) : undefined;
  
        return await this.message.reply(content);
    }
  
    async embedReply(
        title: string, 
        text?: string, 
        status?: ErrorLevel, 
        _ephemeral = false, 
        options: Omit<BaseMessageOptions, "embeds"> = {}
    ) {
        if (this.guild.members.me && !this.channel.permissionsFor(this.guild.members.me).has([
            PermissionsBitField.Flags.SendMessages, 
            PermissionsBitField.Flags.AttachFiles
        ])) throw new Error("Missing permissions");
  
        return await this.message.reply({
            embeds: [embedMessage(title, text, status)],
            ...options,
        });
    }
}
