module.exports = {
  id: "ping",
  description: "Check your and the bot's latency",
  category: "Utility",
  aliases: ["pi"],
  slash: "both",
  expectedArgs: [],

  execute: async (cmd, { client, reply }) => {
    await reply(`☑ Latency: **${new Date().getTime() - cmd.createdTimestamp}**ms | Bot latency: **${client.ws.ping}**ms`);
  },
};
