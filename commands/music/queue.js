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
          min: 1,
          max: 32767,
          required: true,
        },
      ],
    },
    {
      type: "Subcommand",
      name: "remove_many",
      description: "Remove multiple items from queue using their queue list index",
      expectedArgs: [
        {
          type: "Integer",
          name: "starting_index",
          description: "The start index of queue items (inclusive)",
          min: 1,
          max: 32767,
          required: true,
        },
        {
          type: "Integer",
          name: "ending_index",
          description: "The end index of queue items (inclusive)",
          min: 1,
          max: 32767,
          required: true,
        },
      ],
    },
  ],
  execute: async (cmd, { client, member, guildId, subcommand, args, embedReply, reply }) => {
    const vc = member.voice?.channel?.id;
    if (vc == null) return await embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return await embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return await embedReply("Not in corresponding V.C.", "You must be in the same voice channel as the bot to use this command.", "error");
    switch (subcommand) {
      case "list": {
        if (player?.queue?.length == 0) return await embedReply("Queue is empty");

        const embed = new EmbedBuilder().setTitle("— Queue —").setColor(colors.primary);
        let queueList = `Currently playing: \n[${player.queue.current.title}](${player.queue.current.uri}) | ~${formatMS(
          player.queue.current.duration - player.position,
          true
        ).padStart(5, "00:")} left | <@${player.queue.current.requester.id}>${player.trackRepeat ? " | *LOOPING*" : ""}\n\n`;
        for (var i = 0; i < player.queue.length; i++) {
          if (i === 0) {
            queueList += `**— Coming up —**\n\n1. ${
              player.queue[i].uri ? `[${player.queue[i].title}](${player.queue[0].uri})` : player.queue[i].title
            } | ${formatMS(player.queue[i].duration, true).padStart(5, "00:")} | <@${player.queue[i].requester.id}>\n`;
          } else {
            const nextItem = `${i + 1}. ${player.queue[i].uri ? `[${player.queue[i].title}](${player.queue[0].uri})` : player.queue[i].title} | ${formatMS(
              player.queue[i].duration,
              true
            ).padStart(5, "00:")} | <@${player.queue[i].requester.id}>\n`;
            if (nextItem.length + queueList.length > 4096 - 3) {
              if (queueList.length + 3 <= 4096 && queueList.length + 3 >= 4096 - queueList.length) queueList += "...";
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
            inline: true,
          },
          {
            name: "Total tracks",
            value: `${player.queue.length}`,
            inline: true,
          },
        ]);

        if (player.queueRepeat) {
          embed.addFields([
            {
              name: "*LOOPING*",
              value: "\u200B",
              inline: true,
            },
          ]);
        }

        await reply(null, false, { embeds: [embed] });
        break;
      }
      case "remove": {
        const removeIndex = args[0];

        if (removeIndex > player.queue.length)
          return await embedReply(`Selected index ${removeIndex} out of range`, "Ensure the track index is within with queue list", "warn");

        try {
          const trackName = player.queue[removeIndex - 1].title;
          player.queue.remove(removeIndex - 1);
          await embedReply("Track removed", trackName);
        } catch {
          await embedReply("Failed to remove track", "Ensure the track index is correct with queue list", "warn");
        }
        break;
      }
      case "remove_many": {
        const startRemoveIndex = args[0];
        const endRemoveIndex = args[1];

        if (startRemoveIndex > player.queue.length || endRemoveIndex > player.queue.length)
          return await embedReply(
            `Selected index ${startRemoveIndex}-${endRemoveIndex} out of range`,
            "Ensure the track index is within with queue list",
            "warn"
          );

        try {
          player.queue.remove(startRemoveIndex - 1, endRemoveIndex);
          await embedReply(`${endRemoveIndex - startRemoveIndex} tracks removed`);
        } catch {
          await embedReply("Failed to remove tracks", "Ensure the tracks' index is correct with queue list", "warn");
        }
        break;
      }
    }
  },
};
