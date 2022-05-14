module.exports = {
  id: "sudo",
  description: "Execute command as super user",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 5,
  expectedArgs: [
    {
      type: "String",
      name: "command",
      description: "The elevated command to be executed",
      required: true,
    },
  ],

  execute: (cmd, { client, channel, args, isInteraction }) => {
    try {
      const js = args.join(" ");
      eval(js.replace("client.token", "'fuck you'"));

      if (isInteraction) return cmd.reply({ content: "Successfully executed command." });

      cmd.react("☑");
    } catch (err) {
      console.warn(err);
      cmd.reply({
        content: `Failed to execute command:\n\`\`\`${err}\`\`\``,
      });
    }
  },
};
