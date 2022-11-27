import { ApplicationCommandOptionType, ActionRowBuilder, SelectMenuBuilder, User, MessageActionRowComponentBuilder } from "discord.js";
import url from "url";

import Command from "../../classes/Command";
import { createMusicEmbed, embedMessage, formatTime, validateVideoUrl } from "../../utilities";

export default new Command({
  id: "play",
  description: "Plays music in V.C.",
  category: "Music",
  aliases: ["p", "pl"],
  slash: true,
  permissions: ["Speak", "Connect"],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "track",
      description: "Desired track name/URL",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "choose",
      description: "Manually select track from query list",
      choices: [
        {
          name: "Yes",
          value: "yee_yee_yee",
        },
      ],
    },
  ],
}, async (client, context) => {
  const track = context.options[0] as string;
  const choose = context.options[1] as string;
  const vc = context.member.voice?.channel?.id;

  if (vc == null) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

  const player = client.audioManager.create({
    guild: context.guild.id,
    voiceChannel: vc,
    textChannel: context.channel.id,
  });

  if (player.textChannel !== context.channel.id) {
    player.setTextChannel(context.channel.id);
  }

  const results = await client.audioManager.search(track, context.user);

  if (results.loadType === "NO_MATCHES" || results.loadType === "LOAD_FAILED") {
    return await context.embedReply("No song found", `<@${context.user.id}>`, "warn");
  }

  if (!validateVideoUrl(track) && choose === "yee_yee_yee") {
    if (client.playStore.get(`${context.user.id}_${context.guild.id}`)) {
      return await context.embedReply("A select menu is already active", undefined, "warn");
    }
    const menu = new SelectMenuBuilder()
      .addOptions([
        ...results.tracks
          .map((track, i) => ({
            label: track.title,
            value: i.toString(),
          }))
          .slice(0, 24),
        { label: "Cancel", value: "cancel" },
      ])
      .setCustomId(`play_${context.user.id}_${context.guild.id}`);
    client.playStore.set(`${context.user.id}_${context.guild.id}`, results.tracks);
    await context.reply({ 
      content: `${context.member}`, 
      components: [new ActionRowBuilder<MessageActionRowComponentBuilder>({ components: [menu] })] 
    });
  } else {
    player.connect();

    if (results.loadType === "PLAYLIST_LOADED") {
      for (let i = 0; i < results.tracks.length; i++) {
        const track = results.tracks[i];
        player.queue.add(track);
      }
      if (player.queue.length > 0) {
        await context.reply({
          embeds: [embedMessage("++🎶 Songs added to queue", results.playlist?.name)],
        });
      } else {
        await context.embedReply("Preparing to play...");
      }
      if (!player.playing && !player.paused && player.queue.length === results.tracks.length - 1) player.play();
    } else {
      const startTime = url.parse(track, true).query?.t;

      if (typeof startTime === "string") client.trackStartTime.set(context.guild.id, parseInt(startTime));

      player.queue.add(results.tracks[0]);

      if (player.queue.length > 0) {
        await context.reply({
          embeds: [
            createMusicEmbed({
              status: "++🎶 Song added to queue",
              thumbnail: results.tracks[0].thumbnail ?? undefined,
              title: results.tracks[0].title,
              url: results.tracks[0].uri,
              artist: results.tracks[0].author,
              duration: formatTime(results.tracks[0].duration, true).padStart(5, "00:"),
              requester: (results.tracks[0].requester as User | undefined)?.id,
            }),
          ],
        });
      } else {
        await context.embedReply("Preparing to play...");
      }
      if (!player.playing && !player.paused && !player.queue.size) player.play();
    }
  }
});
