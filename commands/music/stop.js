const { EmbedBuilder } = require("discord.js");

function createEmbed() {}

module.exports = {
  id: "stop",
  description: "Stops playing whatever is playing",
  category: "music",
  aliases: [],
  slash: "both",
  expectedArgs: [],
  execute: async (cmd, { client, guildId, channel, channelId, args, member }) => {
    const player = client.manager.players.get(guildId);
    if (!player) return cmd.reply("No music is playing");
    if (player.voiceChannel !== member.voice.channel.id) return cmd.reply("You're not in the same voice channel as the music player");
    player.stop();
    return cmd.reply("Stopped playing music");
  },
};
