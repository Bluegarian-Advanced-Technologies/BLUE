module.exports = {
  id: "ping",
  description: "Check your and the bot's latency",
  category: "Utility",
  aliases: ["pi"],
  slash: "both",
  expectedArgs: [],

  execute: (cmd, { client, args, isInteraction }) => {
    cmd.reply({
      content: `☑ Latency: **${cmd.createdAt.getTime() - new Date().getTime()}**ms | Bot latency: **${client.ws.ping}**ms`,
    });
  },
};
