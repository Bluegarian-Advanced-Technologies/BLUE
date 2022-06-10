module.exports = {
  id: "join",
  description: "Connects to your voice channel",
  category: "Music",
  aliases: ["connect"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  expectedArgs: [],
  async execute(cmd, { client, guildId, channelId, isInteraction, member, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (!vc) return await embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    if (client.audioManager.players.get(guildId) != null) return await embedReply("Already connected to V.C.");

    const player = client.audioManager.create({
      guild: guildId,
      voiceChannel: vc,
      textChannel: channelId,
    });

    player.connect();

    if (isInteraction) {
      cmd.reply({ content: "☑", ephemeral: true });
    } else {
      await cmd.react("☑");
    }
  },
};
