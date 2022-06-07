const { formatMS } = require("../../utils");
const { colors } = require("../../config.json");

const { EmbedBuilder } = require("discord.js");

module.exports = {
  id: "queue",
  description: "Perform queue related operations",
  category: "Music",
  aliases: ["q"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  expectedArgs: [
    {
      type: "Subcommand",
      name: "list",
      description: "View the queue",
      expectedArgs: [],
    },
    {
      type: "Subcommand",
      name: "remove",
      description: "Remove an item from queue using its queue list index",
      expectedArgs: [
        {
          type: "Integer",
          name: "queue_index",
          description: "The index of the queue item",
          required: true,
        },
      ],
    },
  ],
  execute: async (cmd, { client, member, guildId, subcommand, embedReply, reply }) => {
    const vc = member.voice?.channel?.id;
    if (vc == null) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be in the same voice channel as the bot to use this command.", "error");

    switch (subcommand) {
      case "list": {
        if (player?.queue?.length == 0) return embedReply("Queue is empty");

        const embed = new EmbedBuilder().setTitle("— Queue —").setColor(colors.primary);
        let queueList = `Currently playing: \n**${player.queue.current.title}** | ~${formatMS(player.queue.current.duration - player.position, true).padStart(
          5,
          "00:"
        )} left | <@${player.queue.current.requester.id}>\n\n`;
        for (var i = 0; i < player.queue.length; i++) {
          if (i === 0) {
            queueList += `**— Full list —**\n\n1. **${player.queue[i].title}** | ${formatMS(player.queue[i].duration, true).padStart(5, "00:")} | <@${
              player.queue[i].requester.id
            }>\n`;
          } else {
            const nextItem = `${i + 1}. **${player.queue[i].title}** | ${formatMS(player.queue[i].duration, true).padStart(5, "00:")} | <@${
              player.queue[i].requester.id
            }>\n`;
            if (nextItem.length + queueList.length > 4096) {
              if (queueList.length + 5 <= 4096 && queueList.length + 5 >= 4096 - queueList.length) queueList += "\n...\n";
              break;
            } else {
              queueList += nextItem;
            }
          }
        }
        embed.setDescription(queueList.slice(0, 4096));

        embed.addFields([
          {
            name: "Total duration",
            value: `${formatMS(player.queue.duration, true).padStart(5, "00:")}`,
          },
        ]);

        await reply(null, false, { embeds: [embed] });
      }
    }
  },
};
