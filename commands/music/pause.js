module.exports = {
  id: "pause",
  description: "Pauses the playback",
  category: "Music",
  aliases: [],
  slash: "both",
  expectedArgs: [],
  async execute(cmd, { client, guildId, member, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (vc == null) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    player.pause(player.playing);
    return embedReply(`${player.playing ? "Resumed" : "Paused"} the music`);
  },
};
