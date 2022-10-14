import chalk from "chalk";
import { ApplicationCommandOptionType } from "discord.js";
import { OptionType } from "../../classes/BACH";
import Command from "../../classes/Command";
import { Context } from "../../classes/Context";
import Event from "../../classes/Event";
import { embedMessage } from "../../utilities";

export default new Event({
  id: "interaction",
  once: false,
  eventType: "interactionCreate",
  disableExempted: true,
}, async (client, interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

  const command = client.bach.commands.get(interaction.commandName) as Command | undefined;
  if (!command) return;

  let subcommand: string | undefined;

  if (command.hasSubcommands) {
    subcommand = interaction.options.getSubcommand();
  }

  const flattenOptions = () => {
    const result: OptionType[] = [];
    interaction.options.data.forEach(option => {
      if (option.type === ApplicationCommandOptionType.Subcommand || option.type === ApplicationCommandOptionType.SubcommandGroup) {
        option.options?.forEach(subOption => {
          result.push(subOption.value);
        });
      } else {
        result.push(option.value);
      }
    });
    return result;
  }

  const context = Context.create(client, interaction, {
    subcommand,
    options: flattenOptions()
  });

  const reply = await client.bach.runCommandChecks(command, context);
  if (reply) return;

  try {
    await command.execute(client, context);

    client.bach.commandCooldowns.addCooldown(interaction.user.id, interaction.guild!.id, command.cooldown);
  } catch (e) {
    console.error(chalk.red(`${(e as Error)}`));
    const body = {
      content: `**FATAL EXCEPTION CAUGHT!**\n ||<@${client.application!.owner!.id}>||`,
      embeds: [embedMessage((e as Error).name, (e as Error).message, "error")],
    };
    if (interaction.replied) {
      await interaction.channel!.send(body);
    } else {
      await interaction.reply(body);
    }
  }
});