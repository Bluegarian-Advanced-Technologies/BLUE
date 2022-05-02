const { MessageEmbed } = require("discord.js");

function createEmbed() {}

module.exports = {
  id: "stop",
  description: "Stops playing whatever is playing", // Plays music:tm: lol
  category: "music",
  aliases: [],
  slash: "both",
  expectedArgs: [],
  async execute(cmd, { client, guildID, channel, channelID, args, member }) {
    const player = client.manager.players.get(guildID);
    if (!player) return cmd.reply("No music is playing");
    if (player.voiceChannel !== member.voice.channel.id) return cmd.reply("You're not in the same voice channel as the music player");
    player.stop();
    return cmd.reply("Stopped playing music");
  },
};
