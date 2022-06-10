module.exports = {
  id: "stop",
  description: "Stops playback and clears queue",
  category: "Music",
  aliases: [],
  slash: "both",
  expectedArgs: [],
  permissions: ["Speak", "Connect"],
  execute: async (cmd, { client, guildId, member, embedReply }) => {
    const vc = member.voice?.channel?.id;
    if (vc == null) return await embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return await embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return await embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    player.queue.clear();

    client.expectedAudioEvents.set(guildId, "queueend");

    player.stop();

    await embedReply("Stopped playback and cleared queue");
  },
};
