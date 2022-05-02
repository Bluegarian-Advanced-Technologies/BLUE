const { createMusicEmbed } = require("./embed");

module.exports = {
  id: "play",
  description: "Plays music in VC",
  category: "music",
  aliases: ["p"],
  slash: "both",
  expectedArgs: [
    {
      type: "string",
      name: "song",
      description: "Song query to search for/play",
      required: true,
    },
  ],
  async execute(cmd, { client, guildID, channel, channelID, args }) {
    const res = await client.manager.search(args.join(" "), cmd.author);
    const player = client.manager.create({
      guild: guildID,
      voiceChannel: cmd.member.voice.channel.id,
      textChannel: channelID,
    });

    player.connect();
    player.queue.add(res.tracks[0]);
    cmd.reply(`Enqueuing track ${res.tracks[0].title}.`);

    if (!player.playing && !player.paused && !player.queue.size) player.play();

    if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
  },
};
