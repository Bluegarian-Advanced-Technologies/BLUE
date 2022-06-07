module.exports = {
  id: "disconnect",
  description: "Disconnects from the voice channel",
  category: "Music",
  aliases: ["dc", "leave", "bye", "fuckoff"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  expectedArgs: [],
  async execute(command, { client, guildId, member, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (!vc) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);

    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    embedReply("👋 Goodbye");
    client.expectedAudioEvents.set(guildId, "disconnect");
    player.destroy();
  },
};
