// module.exports = {
//   notCommand: true, // idk
// };

const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  id: "queue",
  description: "View the queue.",
  aliases: ["q"],
  slash: "both",
  expectedArgs: [],
  category: "Music",
  execute: async (interaction, { member, guildId, embedReply }) => {
    const vc = member.voice?.channel?.id;
    if (vc == null) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be in the same voice channel as the bot to use this command.", "error");

    if (!player) return context.reply("Nothing is playing right now. :frowning:");
    const embed = new EmbedBuilder().setTitle("Current queue");
    var description = `__**Currently playing**__\n\`${player.queue.current.title}\` | Requested by ${player.queue.current.requester.tag}\n\n`;
    for (var i = 0; i < player.queue.length; i++) {
      var first = description;
      if (i === 0) {
        description += `__**Queue**__\n1. \`${player.queue[i].title}\` | Requested by ${player.queue[i].requester.tag}\n`;
      } else {
        description += `${i + 1}. \`${player.queue[i].title}\` | Requested by ${player.queue[i].requester.tag}\n`;
      }
      if (description.length >= 4096) {
        embed.setDescription(first);
        break;
      }
    }
    if (!embed.description) embed.setDescription(description);
    embed.addFields([
      {
        name: "Note",
        value: "If you have a ***really long*** queue, it might cut off due to how long it is. (don't worry, you'll be fine)",
      },
    ]);
    const component = new ActionRowBuilder().addComponents([
      new ButtonBuilder({
        label: "Pause",
        style: ButtonStyle.Primary,
        customId: `pause_${context.guild.id}`,
      }),
    ]);
    await interaction.reply({ embeds: [embed], components: [component] });
  },
};
