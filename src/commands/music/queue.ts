import { ApplicationCommandOptionType, ColorResolvable, EmbedBuilder, User } from "discord.js";
import Command from "../../classes/Command";

import { formatTime } from "../../utilities";
import settings from "../../settings.json" assert { type: "json" };

export default new Command({
  id: "queue",
  description: "Perform queue related operations",
  category: "Music",
  aliases: ["q"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "list",
      description: "View the queue",
      options: []
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "remove",
      description: "Remove an item from queue using its queue list index",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "queue_index",
          description: "The index of the queue item",
          minValue: 1,
          maxValue: 32767,
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "remove_many",
      description: "Remove multiple items from queue using their queue list index",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "starting_index",
          description: "The start index of queue items (inclusive)",
          minValue: 1,
          maxValue: 32767,
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "ending_index",
          description: "The end index of queue items (inclusive)",
          minValue: 1,
          maxValue: 32767,
          required: true,
        },
      ],
    },
  ],
}, async (client, context) => {
  const vc = context.member.voice?.channel?.id;
  if (vc == null) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

  const player = client.audioManager.players.get(context.guild.id);
  if (!player) return await context.embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
  if (player.voiceChannel !== vc)
    return await context.embedReply("Not in corresponding V.C.", "You must be in the same voice channel as the bot to use this command.", "error");
  switch (context.subcommand) {
    case "list": {
      if (player?.queue?.length == 0 && !player.playing) return await context.embedReply("Queue is empty");

      const embed = new EmbedBuilder().setTitle("— Queue —").setColor(settings.colors.primary as ColorResolvable);
      let queueList = `Currently playing: \n[${player.queue.current!.title}](${player.queue.current!.uri}) | ~${formatTime(
        player.queue.current!.duration! - player.position,
        true
      ).padStart(5, "00:")} left | <@${(player.queue.current!.requester as User).id}>${player.trackRepeat ? " | *LOOPING*" : ""}\n\n`;

      for (var i = 0; i < player.queue.length; i++) {
        if (i === 0) {
          queueList += `**— Coming up —**\n\n1. ${
            player.queue[i].uri ? `[${player.queue[i].title}](${player.queue[0].uri})` : player.queue[i].title
          } | ${formatTime(player.queue[i].duration!, true).padStart(5, "00:")} | <@${(player.queue[i].requester as User)?.id}>\n`;
        } else {
          const nextItem = `${i + 1}. ${player.queue[i].uri ? `[${player.queue[i].title}](${player.queue[0].uri})` : player.queue[i].title} | ${formatTime(
            player.queue[i].duration!,
            true
          ).padStart(5, "00:")} | <@${(player.queue[i].requester as User).id}>\n`;
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
          value: `${formatTime(player.queue.duration, true).padStart(5, "00:")}`,
          inline: true,
        },
        {
          name: "Total tracks",
          value: `${player.queue.length + (player.playing ? 1 : 0)}`,
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

      await context.reply({ embeds: [embed] });
      break;
    }
    case "remove": {
      const removeIndex = context.options[0] as number;

      if (removeIndex > player.queue.length)
        return await context.embedReply(`Selected index ${removeIndex} out of range`, "Ensure the track index is within with queue list", "warn");

      try {
        const trackName = player.queue[removeIndex - 1].title;
        player.queue.remove(removeIndex - 1);
        await context.embedReply("Track removed", trackName);
      } catch {
        await context.embedReply("Failed to remove track", "Ensure the track index is correct with queue list", "warn");
      }
      break;
    }
    case "remove_many": {
      const startRemoveIndex = context.options[0] as number;
      const endRemoveIndex = context.options[1] as number;

      if (startRemoveIndex > player.queue.length || endRemoveIndex > player.queue.length)
        return await context.embedReply(
          `Selected index ${startRemoveIndex}-${endRemoveIndex} out of range`,
          "Ensure the track index is within with queue list",
          "warn"
        );

      try {
        player.queue.remove(startRemoveIndex - 1, endRemoveIndex);
        await context.embedReply(`${endRemoveIndex - startRemoveIndex} tracks removed`);
      } catch {
        await context.embedReply("Failed to remove tracks", "Ensure the tracks' index is correct with queue list", "warn");
      }
      break;
    }
  }
});
