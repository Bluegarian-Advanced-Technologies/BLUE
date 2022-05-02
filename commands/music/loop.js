const { MessageEmbed } = require("discord.js");

function createEmbed() {}

module.exports = {
  id: "loop",
  description: "Loops the queue",
  category: "music",
  aliases: ["repeat"],
  slash: "both",
  expectedArgs: [
    {
      type: "string",
      name: "trackOrQueue",
      description: "Loops the track or queue",
      required: true,
    },
  ],
  async execute(cmd, { client, guildID, channel, channelID, args, member }) {
    const player = client.manager.players.get(guildID);
    if (!player) return cmd.reply("There is no music playing");
    if (player.voiceChannel !== member.voice.channel.id) return cmd.reply("You're not in the same voice channel as the music player");
    if (args[0] === "track") {
      player.setTrackRepeat(!player.paused);
      return cmd.reply(`${player.paused ? "Resumed" : "Paused"} the music`);
    }
    if (args[0] === "queue") {
      player.setQueueRepeat(!player.paused);
      return cmd.reply(`${player.paused ? "Resumed" : "Paused"} the queue`);
    }
  },
};
