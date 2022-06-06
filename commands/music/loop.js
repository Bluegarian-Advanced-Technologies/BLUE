module.exports = {
  id: "loop",
  description: "Loops the track/queue",
  category: "Music",
  aliases: ["repeat"],
  slash: "both",
  expectedArgs: [
    {
      type: "String",
      name: "looptype",
      description: "Loops the track or queue",
      required: true,
      options: [
        {
          name: "Track",
          value: "track",
        },
        {
          name: "Queue",
          value: "queue",
        },
      ],
    },
  ],
  execute: async (cmd, { client, guildId, args, member, embedReply }) => {
    const vc = member.voice?.channel?.id;
    if (vc == null) return embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(guildId);
    if (!player) return embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    if (args[0] === "track") {
      player.setTrackRepeat(!player.trackRepeat);
      if (player.trackRepeat) {
        return embedReply("🔂 Now looping the current track");
      } else {
        return embedReply("No longer looping the current track");
      }
    }
    if (args[0] === "queue") {
      player.setQueueRepeat(!player.queueRepeat);
      if (player.queueRepeat) {
        return embedReply("🔁 Now looping the queue");
      } else {
        return embedReply("No longer looping the queue");
      }
    }
  },
};
