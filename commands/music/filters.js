module.exports = {
  id: "filter",
  description: "Adds a filter to the player",
  category: "Music",
  aliases: ["f"],
  slash: "both",
  expectedArgs: [
    {
      type: "String",
      name: "filter",
      description: "The filter to add",
      required: true,
      options: [
        {
          name: "Nightcore",
          value: "nightcore",
        },
        {
          name: "Vaporwave",
          value: "vaporwave",
        },
        {
          name: "Bassboost",
          value: "bassboost",
        },
        {
          name: "Pop",
          value: "pop",
        },
        {
          name: "Soft",
          value: "soft",
        },
        {
          name: "Treblebass",
          value: "treblebass",
        },
        {
          name: "8D",
          value: "eightD",
        },
        {
          name: "Karaoke",
          value: "karaoke",
        },
        {
          name: "Vibrato",
          value: "vibrato",
        },
        {
          name: "Tremolo",
          value: "tremolo",
        },
        {
          name: "Reset (remove all filters)",
          value: "reset",
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

    if (args[0] === "reset") {
      player.reset(null);
      embedReply("Removed all filters");
    } else {
      player[args[0]] = !player[args[0]];
      embedReply("Filter " /* + args[0] + " " */ + (player[args[0]] ? "added" : "removed"));
    }
  },
};
