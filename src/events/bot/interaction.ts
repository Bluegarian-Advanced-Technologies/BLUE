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
  })

  const reply = await client.bach.runCommandChecks(command, context);
  if (reply) return;

  // const args = [];

  // function subargParse(arg) {
  //   for (const subarg of arg.expectedArgs) {
  //     let interactionOption;
  //     interactionOption = interaction.options["get" + subarg.type](subarg.name);
  //     if (!arg.required && interactionOption == null) continue;
  //     args.push(interactionOption);
  //   }
  // }

  // for (const arg of command.options) {
  //   let interactionOption;

  //   if (
  //     arg.type !== ApplicationCommandOptionType.SubcommandGroup && 
  //     arg.type !== ApplicationCommandOptionType.Subcommand
  //   ) {
  //     interactionOption = interaction.options.get(arg.name);
  //     if (!arg.required && interactionOption == null) continue;
  //     if (interactionOption?.value == null) {
  //       console.error(`Execting command ${command.id}`, `Failure on argument`, arg.name);

  //       await interactionReply(
  //         "**UNEXPECTED ERROR**\nThe notorious unreproducable error has struck again! The command will not be executed.\n\n||<@577195213068566529>||"
  //       );

  //       return;
  //     }
  //     args.push(interactionOption.value);
  //   } else {
  //     if (arg.name !== subcommand) continue;
  //     subargParse(arg);
  //     break;
  //   }
  // }

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