module.exports = {
  id: "resume",
  description: "Resumes the playback",
  category: "Music",
  aliases: ["r"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  expectedArgs: [],
  async execute(cmd, { client, member, guildId, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (vc == null) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    if (player.playing) return embedReply(`Already playing`, null, "warn");

    player.pause(false);
    return embedReply(`Resumed the playback`);
  },
};
