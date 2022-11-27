import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";

export default new Command({
  id: "sudo",
  description: "Execute command as super user",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 5,
  disableExempted: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "command",
      description: "The elevated command to be executed",
      required: true,
    },
  ],
}, async (client, context) => {
  try {
    const js = context.options[0] as string;
    eval(js.replace(/client.token|process.env/g, "'fuck you'"));

    if (context.isInteractionBased()) return await context.reply({ content: "Successfully executed command." });

    if (context.isTextBased()) return await context.message.react("☑");
  } catch (e) {
    console.warn(e);
    return await context.reply({
      content: `Failed to execute command:\n\`\`\`${e}\`\`\``,
    });
  }
});
