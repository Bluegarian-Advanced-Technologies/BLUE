const { MessageEmbed } = require("discord.js");

function createEmbed() {}

module.exports = {
  id: "pause",
  description: "Pauses or resumes the music",
  category: "music",
  aliases: [],
  slash: "both",
  expectedArgs: [],
  async execute(cmd, { client, guildID, channel, channelID, args, member }) {
    const player = client.manager.players.get(guildID);
    if (!player) return cmd.reply("There is no music playing");
    if (player.voiceChannel !== member.voice.channel.id) return cmd.reply("You're not in the same voice channel as the music player");
    player.pause(player.playing);
    return cmd.reply(`${player.playing ? "Resumed" : "Paused"} the music`);
  },
};
