import { ApplicationCommandOptionType, ApplicationCommandSubCommandData, ColorResolvable, EmbedBuilder } from "discord.js";
import { ApplicationCommandPrimitiveData } from "../classes/BACH";
import Client from "../classes/Client";
import Command from "../classes/Command";

import settings from "../settings.json" assert { type: "json" };

const createArgString = (args: ApplicationCommandPrimitiveData[]) => {
  let argConstruct = "";

  args.forEach((arg) => {
    if (arg.required) {
      argConstruct += ` <${arg.name}>`;
    } else {
      argConstruct += ` [${arg.name}]`;
    }
  });

  return argConstruct;
};

const commandCategories: CategoryData[] = [];

interface CommandData {
  id: string;
  description: string;
  arguments: string;
}

interface CategoryData {
  category: string;
  commands: CommandData[];
}

const populateCommandCategories = (client: Client) => {
  client.bach.commands.forEach((command) => {
    if (command.alias || command.hidden) return;

    if (commandCategories.length === 0) {
      // Push to new category as categories are empty
      const commandsList = [];

      if (command.hasSubcommands) {
        command.options.forEach((arg) => {
          commandsList.push({
            id: `${command.id} ${arg.name}`,
            description: arg.description,
            arguments: createArgString((arg as ApplicationCommandSubCommandData).options as ApplicationCommandPrimitiveData[]),
          });
        });
      } else {
        commandsList.push({
          id: command.id,
          description: command.description,
          arguments: createArgString(command.options as ApplicationCommandPrimitiveData[]),
        });
      }

      commandCategories.push({
        category: command.category,
        commands: commandsList,
      });
    } else {
      const commandsList = [];

      for (let i = 0; i < commandCategories.length; i++) {
        const category = commandCategories[i];

        if (category.category === command.category) {
          // Push to existing category
          if (command.hasSubcommands) {
            command.options.forEach((arg) => {
              category.commands.push({
                id: `${command.id} ${arg.name}`,
                description: arg.description,
                arguments: createArgString((arg as ApplicationCommandSubCommandData).options as ApplicationCommandPrimitiveData[]),
              });
            });
          } else {
            category.commands.push({
              id: command.id,
              description: command.description,
              arguments: createArgString(command.options as ApplicationCommandPrimitiveData[]),
            });
          }
          return;
        }
      }

      // Push to new category since not yet made
      if (command.hasSubcommands) {
        command.options.forEach((arg) => {
          commandsList.push({
            id: `${command.id} ${arg.name}`,
            description: arg.description,
            arguments: createArgString((arg as ApplicationCommandSubCommandData).options as ApplicationCommandPrimitiveData[]),
          });
        });
      } else {
        commandsList.push({
          id: command.id,
          description: command.description,
          arguments: createArgString(command.options as ApplicationCommandPrimitiveData[]),
        });
      }

      commandCategories.push({
        category: command.category,
        commands: commandsList,
      });
    }
  });
};

export default new Command({
  id: "help",
  description: "Display BLUE's help menu",
  category: "Help",
  aliases: ["?"],
  slash: "both",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "category",
      description: "View commands of specified module category",
      choices: [] // Dynamically generated, help command is forced to be last command to be registered
    },
  ],
  disableExempted: true,
}, async (client, context) => {
  const helpEmbed = new EmbedBuilder()
    .setColor(settings.colors.primary as ColorResolvable)
    .setAuthor({ name: "BLUE Help Center", iconURL: settings.assets.icon })
    .setTimestamp()
    .setFooter({ text: "Bluegarian Logistics Universal Emulator: BLUE", iconURL: settings.assets.icon });

  const helpCategory = context.options[0] as string;

  if (helpCategory == null) {
    if (commandCategories.length === 0) populateCommandCategories(client);

    helpEmbed.setDescription("All command categories are listed below. Get commands of one category with `help [category name]`.\n\u200B");
    const fields = commandCategories.map((category) => {
      return { name: category.category, value: `${category.commands.length} command${category.commands.length > 1 ? "s" : ""}`, inline: true };
    });

    helpEmbed.addFields(fields);

    return await context.reply({
      embeds: [helpEmbed],
    });
  }

  if (commandCategories.length === 0) {
    populateCommandCategories(client);
  }

  if (helpCategory != null) {
    const category = commandCategories.find((cat) => cat.category === helpCategory);

    if (category == null) {
      return await context.reply({
        embeds: [
          helpEmbed
            .setColor(settings.colors.error as ColorResolvable)
            .setDescription(`Category \`${helpCategory}\` does not exist.`),
        ],
      });
    }

    helpEmbed.setTitle(`Commands of ${category!.category}`);
    helpEmbed.setDescription(
      `Command options wrapped in \`<>\` are **required**, whilst \`[]\` are **optional**. All commands have their (**/**) variants.\n`
    );
    const fields = [];

    for (let i = 0; i < category!.commands.length; i++) {
      const command = category!.commands[i];

      fields.push({
        name: `${settings.prefix}\`${command.id}${command.arguments}\``,
        value: command.description,
      });
    }

    helpEmbed.addFields(fields);
  } else {
    for (let i = 0; i < commandCategories.length; ++i) {
      const category = commandCategories[i];
      const fields = [];

      for (let o = 0; o < category.commands.length; o++) {
        const command = category.commands[o];
        fields.push({ name: `${settings.prefix}\`${command.id}${command.arguments}\``, value: command.description });
      }

      helpEmbed.addFields(fields);
    }
  }

  await context.reply({ embeds: [helpEmbed] });
});
