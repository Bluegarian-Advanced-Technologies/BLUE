import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";
import { formatTime } from "../../utilities";

export default new Command({
  id: "seek",
  description: "Seek to a time in the track",
  category: "Music",
  aliases: [],
  slash: "both",
  permissions: ["Speak", "Connect"],
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: "seconds",
      description: "Number of seconds to seek to",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "relative",
      description: "Seek forwards/backwards relative to current time in track",
      choices: [
        {
          name: "Yes",
          value: "yes",
        },
      ],
    },
  ],
}, async (client, context) => {
    const vc = context.member.voice?.channel?.id;
    if (!vc) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(context.guild.id);

    if (!player) return await context.embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return await context.embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    const seconds = context.options[0] as number;
    const relative = context.options[1] as string;

    const isRelative = relative === "yes";

    await context.embedReply(
      `Seeked to ${
        isRelative ? formatTime(Math.round(player.position + seconds * 1000), true).padStart(5, "00:") : formatTime(seconds * 1000, true).padStart(5, "00:")
      }`,
      "Allow a few seconds for seek to complete"
    );

    if (isRelative) {
      player.seek(player.position + seconds * 1000);
    } else {
      player.seek(seconds * 1000);
    }
});
