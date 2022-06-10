const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const Filters = require("erela.js-filters");

const { embedMessage, formatMS } = require("../../utils");
const { createMusicEmbed, validateYTURL } = require("./musicUtils");

const { ActionRowBuilder, SelectMenuBuilder } = require("discord.js");

module.exports = {
  id: "play",
  description: "Plays music in V.C.",
  category: "Music",
  aliases: ["p", "pl"],
  slash: true,
  permissions: ["Speak", "Connect"],
  expectedArgs: [
    {
      type: "String",
      name: "song",
      description: "Desired song name/URL",
      trailing: true,
      required: true,
    },
    {
      type: "String",
      name: "choose",
      description: "Manually select song from query list",
      options: [
        {
          name: "Yes",
          value: "yee_yee_yee",
        },
      ],
    },
  ],
  init: ({ client }) => {
    client.audioManager = new Manager({
      nodes: [
        {
          host: "24.141.115.80",
          port: 2333,
          password: process.env.LAVALINK_PASSWORD,
          secure: false,
        },
      ],
      plugins: [
        new Spotify({
          clientID: process.env.SPOTIFY_CLIENT_ID,
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
        new Filters(),
      ],
      send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
      },
    })
      .on("nodeConnect", (node) => console.log(`Node ${node.options.identifier} connected`))
      .on("nodeError", (node, error) => console.log(`Node ${node.options.identifier} had an error: ${error.message}`))
      .on("trackStart", (player, track) => {
        client.channels.cache.get(player.textChannel).send({
          embeds: [
            createMusicEmbed({
              status: "🎵 Now playing:",
              thumbnail: track.thumbnail,
              title: track.title,
              url: track.uri,
              artist: track.author,
              duration: formatMS(track.duration, true).padStart(5, "00:"),
              requester: track.requester?.id,
            }),
          ],
        });
      })
      .on("queueEnd", (player) => {
        if (client.expectedAudioEvents.get(player.guild) === "queueend") return client.expectedAudioEvents.delete(player.guild);
        client.channels.cache.get(player.textChannel).send({ embeds: [embedMessage("Queue has ended")] });
      })
      .on("trackStuck", (player) => {
        client.channels.cache.get(player.textChannel).send({ embeds: [embedMessage("Current track stuck", "This track has been detected as stuck", "warn")] });
      })
      .on("trackError", (player, track, error) => {
        client.channels.cache
          .get(player.textChannel)
          .send({ embeds: [embedMessage("Error occured with current track: " + error.exception, `${error.error}`, "error")] });
      })
      .on("playerDestroy", (player) => {
        if (client.expectedAudioEvents.get(player.guild) === "disconnect") return client.expectedAudioEvents.delete(player.guild);
        client.channels.cache.get(player.textChannel).send({ embeds: [embedMessage("Disconnected from voice channel")] });
      });
    client.playStore = new Map();
    client.expectedAudioEvents = new Map();
  },
  async execute(cmd, { client, guildId, channelId, user, member, isInteraction, embedReply, send, reply, args }) {
    let song = args[0];
    const vc = member.voice?.channel?.id;

    if (vc == null) return await embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const acknowledge = await embedReply("Preparing to play...", null, undefined, false, {
      fetchReply: true,
    });

    const results = await client.audioManager.search(song, user);

    if (results.loadType === "NO_MATCHES" || results.loadType === "LOAD_FAILED") {
      return await embedReply("No song found", null, "warn");
    }

    const player = client.audioManager.create({
      guild: guildId,
      voiceChannel: vc,
      textChannel: channelId,
    });

    if (!validateYTURL(args[0]) && args[1] === "yee_yee_yee") {
      if (client.playStore.get(`${user.id}_${guildId}`)) {
        return await embedReply("A select menu is already active", null, "warn");
      }
      const menu = new SelectMenuBuilder()
        .addOptions(
          results.tracks
            .map((track, i) => ({
              label: track.title,
              value: i.toString(),
            }))
            .slice(0, 25)
        )
        .setCustomId(`play_${user.id}_${guildId}`);
      client.playStore.set(`${user.id}_${guildId}`, results.tracks);
      send(`${member}`, false, { components: [new ActionRowBuilder({ components: [menu] })] });
    } else {
      player.connect();

      if (results.loadType === "PLAYLIST_LOADED") {
        send(null, false, {
          embeds: [embedMessage("++🎶 Songs added to queue", results.playlist?.name)],
        });
        for (let i = 0; i < results.tracks.length; i++) {
          const track = results.tracks[i];
          player.queue.add(track);
        }
        if (!player.playing && !player.paused && player.queue.length === results.tracks.length - 1) player.play();
      } else {
        player.queue.add(results.tracks[0]);

        if (player.queue.length > 0) {
          send(null, false, {
            embeds: [
              createMusicEmbed({
                status: "++🎶 Song added to queue",
                thumbnail: results.tracks[0].thumbnail,
                title: results.tracks[0].title,
                url: results.tracks[0].uri,
                artist: results.tracks[0].author,
                duration: formatMS(results.tracks[0].duration, true).padStart(5, "00:"),
                requester: results.tracks[0].requester?.id,
              }),
            ],
          });
        }
        if (!player.playing && !player.paused && !player.queue.size) player.play();
      }
    }

    await acknowledge.delete();
  },
};
