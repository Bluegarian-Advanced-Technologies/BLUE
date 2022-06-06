module.exports = {
  id: "seek",
  description: "Seek to a time in the track",
  category: "Music",
  aliases: [],
  slash: "both",
  permissions: ["Speak", "Connect"],
  expectedArgs: [
    {
      type: "Integer",
      name: "seconds",
      description: "Number of seconds to seek to",
      required: true,
    },
  ],
  async execute(command, { client, guildId, member, args, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (!vc) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);

    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    player.seek(args[0] * 1000);

    embedReply(`Seeked to ${args[0]} seconds`);
  },
};
