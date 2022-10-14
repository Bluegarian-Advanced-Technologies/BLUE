import Command from "../../classes/Command";

export default new Command({
  id: "ping",
  description: "Check your and the bot's latency",
  category: "Utility",
  options: [],
  aliases: ["pi"],
  slash: "both",
}, async (client, context) => {
  await context.reply(`☑ Latency: **${new Date().getTime() - context.createdTimestamp}**ms | Bot latency: **${client.ws.ping}**ms`);
});
