import { Manager, ManagerOptions, Track } from "@nextium/erela.js";
import { Client as DiscordClient, ClientOptions, GuildTextBasedChannel, User } from "discord.js";
import { createMusicEmbed, embedMessage, formatTime } from "../utilities";
import BACH from "./BACH";

type ExpectedAudioEvent = "queueEnd" | "disconnect";

class Client extends DiscordClient {
  audioManager: Manager;
  bach: BACH;

  expectedAudioEvents = new Map<string, ExpectedAudioEvent>();
  playStore = new Map<string, ("cancel" | Track)[]>();
  trackStartTime = new Map<string, number>();
  
  constructor(options: ClientOptions, audioOptions: ManagerOptions) {
    super(options);

    this.audioManager = new Manager(audioOptions)
      .on("nodeConnect", (node) => console.log(`Node ${node.options.identifier} connected`))
      .on("nodeError", (node, error) => console.log(`Node ${node.options.identifier} had an error: ${error.message}`))
      .on("trackStart", (player, track) => {
        try {
          const startTime = this.trackStartTime.get(player.guild);
          if (startTime) {
            player.seek(startTime * 1000);
            this.trackStartTime.delete(player.guild);
          }

          const channel = this.channels.cache.get(player.textChannel!) as GuildTextBasedChannel | undefined;
          channel?.send({
            embeds: [
              createMusicEmbed({
                status: "🎵 Now playing:",
                thumbnail: track.thumbnail ?? undefined,
                title: track.title,
                url: track.uri,
                artist: track.author,
                duration: formatTime(track.duration, true).padStart(5, "00:"),
                requester: (track.requester as User | undefined)?.id,
              }),
            ],
          });
        } catch (e) {
          console.error(e);
        }
      })
      .on("queueEnd", (player) => {
        try {
          if (this.expectedAudioEvents.get(player.guild) === "queueEnd") return this.expectedAudioEvents.delete(player.guild);
          const channel = this.channels.cache.get(player.textChannel!) as GuildTextBasedChannel | undefined;
          channel?.send({ embeds: [embedMessage("Queue has ended")] });
        } catch (e) {
          console.error(e);
        }
      })
      .on("trackStuck", (player) => {
        try {
          const channel = this.channels.cache.get(player.textChannel!) as GuildTextBasedChannel | undefined;
          channel?.send({ embeds: [embedMessage("Current track stuck", "The track has been detected as stuck", "warn")] });
        } catch (e) {
          console.error(e);
        }
      })
      .on("trackError", (player, track, error) => {
        try {
          const channel = this.channels.cache.get(player.textChannel!) as GuildTextBasedChannel | undefined;
          channel?.send({ embeds: [embedMessage("Error occured with current track: " + error.exception?.cause, `${error.error}`, "error")] });
        } catch (e) {
          console.error(e);
        }
      })
      .on("playerMove", (player, prevChannel, newChannel) => {
        try {
          if (newChannel == null || newChannel.length === 0) return;

          const wasNotPlaying = player.paused;
          player.setVoiceChannel(newChannel);

          const checkReconnnected: NodeJS.Timer = setInterval(() => {
            if (player.state === "CONNECTED") {
              if (!wasNotPlaying) player.pause(false);
              return clearInterval(checkReconnnected);
            }
          }, 100);
        } catch (err) {
          console.error(err);
        }
      })
      .on("playerDestroy", (player) => {
        try {
          if (this.expectedAudioEvents.get(player.guild) === "disconnect") return this.expectedAudioEvents.delete(player.guild);
          const channel = this.channels.cache.get(player.textChannel!) as GuildTextBasedChannel | undefined;
          channel?.send({ embeds: [embedMessage("Disconnected from voice channel")] });
        } catch (e) {
          console.error(e);
        }
      })
      .on("playerDisconnect", (player) => {
        try {
          if (this.expectedAudioEvents.get(player.guild) === "disconnect") return;
          player.destroy();
        } catch (e) {
          console.error(e);
        }
      });

    this.bach = new BACH(this);
  }
  async run(token: string | undefined, options: { guild?: string | string[]; } = {}) {
    await this.login(token);
    await this.bach.updateApplicationCommands(options.guild);
  }
}

export default Client;
