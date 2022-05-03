const { MessageEmbed } = require("discord.js");

function createEmbed() {}

module.exports = {
  id: "volume",
  description: "Sets the volume of the player",
  category: "music",
  aliases: [],
  slash: "both",
  expectedArgs: [
    {
      type: "number",
      name: "volume",
      description: "The percentage of volume to set the volume to",
      required: true,
    },
  ],
  async execute(cmd, { client, guildId, channel, channelId, args, member }) {
    const player = client.manager.players.get(guildId);
    if (!player) return cmd.reply("There is no music playing");
    if (player.voiceChannel !== member.voice.channel.id) return cmd.reply("You're not in the same voice channel as the music player");
    if (args[0] < 0 || args[0] > 2000) return cmd.reply("The volume must be between 0 and 2000");
    player.setVolume(args[0]);
    cmd.reply(`Set the volume to ${args[0]}%`);
  },
};
