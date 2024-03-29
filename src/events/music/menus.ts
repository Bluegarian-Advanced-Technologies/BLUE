import { User } from "discord.js";
import Event from "../../classes/Event";

import { createMusicEmbed, formatTime } from "../../utilities";

export default new Event({
  id: "menus",
  once: false,
  eventType: "interactionCreate",
  disableExempted: true,
}, async (client, interaction) => {
  if (!interaction.isSelectMenu()) return;
  if (interaction.user.id !== interaction.customId.split("_")[1])
    return interaction.reply({ content: "Sorry, but this isn't your selection panel.", ephemeral: true });

  if (interaction.customId.startsWith("play_")) {
    const player = client.audioManager.players.get(interaction.guild?.id ?? "");
    const combinedId = interaction.customId.split("_").slice(1).join("_");

    if (!client.playStore.has(combinedId)) {
      await interaction.reply({ content: "This selection panel is no longer in use.", ephemeral: true });
      return;
    }

    const track = client.playStore.get(combinedId)![parseInt(interaction.values[0])];

    if (track === "cancel") return client.playStore.delete(combinedId);

    if (player) {
      player.connect();
      player.queue.add(track);

      if (!player.playing && !player.paused && !player.queue.size) player.play();
    }

    await interaction.update({
      content: null,
      embeds: [
        createMusicEmbed({
          status: "++🎶 Song added to queue",
          thumbnail: track.thumbnail ?? "",
          title: track.title,
          url: track.uri,
          artist: track.author,
          duration: formatTime(track.duration, true).padStart(5, "00:"),
          requester: (track.requester as User | undefined)?.id,
        }),
      ],
      components: [],
    });
    client.playStore.delete(combinedId);
  }
});
