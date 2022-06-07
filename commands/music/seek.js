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
    {
      type: "String",
      name: "relative",
      description: "Seek forwards/backwards relative to current time in track",
      options: [
        {
          name: "Yes",
          value: "ye",
        },
      ],
    },
  ],
  async execute(command, { client, guildId, member, args, embedReply }) {
    const vc = member.voice?.channel?.id;
    if (!vc) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);

    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    const isRelative = args[1] === "ye" && args[1] != null;

    embedReply(`Seeked to ${isRelative ? Math.round((player.position + args[0] * 1000) / 1000) : args[0]} seconds`, "Allow a few seconds for seek to complete");

    if (isRelative) {
      player.seek(player.position + args[0] * 1000);
    } else {
      player.seek(args[0] * 1000);
    }
  },
};
