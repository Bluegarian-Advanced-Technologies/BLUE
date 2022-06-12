module.exports = {
  id: "volume",
  description: "Sets the volume of the player",
  category: "Music",
  aliases: [],
  slash: "both",
  permissions: ["Speak", "Connect"],
  expectedArgs: [
    {
      type: "number",
      name: "volume",
      description: "The percentage of volume to set the volume to",
      required: true,
    },
  ],
  async execute(cmd, { client, guildId, args, member, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (vc == null) return await embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return await embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return await embedReply("Not in corresponding V.C.", "You must be in the same voice channel as the bot to use this command.", "error");

    if (args[0] < 0 || args[0] > 2000) return cmd.reply("The volume must be between 0 and 2000");
    await embedReply(`🔊 Set the volume to ${args[0]}%`);
    player.setVolume(args[0]);
  },
};
