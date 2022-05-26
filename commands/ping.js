module.exports = {
  id: "ping",
  description: "Check your and the bot's latency",
  category: "Utility",
  aliases: ["pi"],
  slash: "both",
  expectedArgs: [],

  execute: (cmd, { client, args, isInteraction, reply }) => {
    reply(`☑ Latency: **${new Date().getTime() - cmd.createdTimestamp}**ms | Bot latency: **${client.ws.ping}**ms`);
  },
};
