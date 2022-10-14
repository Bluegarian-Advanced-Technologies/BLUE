import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";

export default new Command({
  id: "loop",
  description: "Loops the track/queue",
  category: "Music",
  aliases: ["repeat"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "loop_type",
      description: "Loops the track or queue",
      required: true,
      choices: [
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
}, async (client, context) => {
  const vc = context.member.voice?.channel?.id;
  if (vc == null) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

  const player = client.audioManager.players.get(context.guild.id);
  if (!player) return await context.embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
  if (player.voiceChannel !== vc)
    return await context.embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

  if (context.options[0] === "track") {
    player.setTrackRepeat(!player.trackRepeat);
    if (player.trackRepeat) {
      return await context.embedReply("🔂 Now looping the current track");
    } else {
      return await context.embedReply("No longer looping the current track");
    }
  }
  if (context.options[0] === "queue") {
    player.setQueueRepeat(!player.queueRepeat);
    if (player.queueRepeat) {
      return await context.embedReply("🔁 Now looping the queue");
    } else {
      return await context.embedReply("No longer looping the queue");
    }
  }
});
