import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";

export default new Command({
  id: "volume",
  description: "Sets the volume of the player",
  category: "Music",
  aliases: [],
  slash: "both",
  permissions: ["Speak", "Connect"],
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: "volume",
      description: "The percentage of volume to set the volume to",
      required: true,
    },
  ],
}, async (client, context) => {
  const vc = context.member.voice?.channel?.id;
  if (vc == null) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

  const player = client.audioManager.players.get(context.guild.id);
  if (!player) return await context.embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
  if (player.voiceChannel !== vc)
    return await context.embedReply("Not in corresponding V.C.", "You must be in the same voice channel as the bot to use this command.", "error");

  const volume = context.options[0] as number;
  if (volume < 0 || volume > 2000) return await context.reply("The volume must be between 0 and 2000");
  await context.embedReply(`🔊 Set the volume to ${volume}%`);
  player.setVolume(volume);
});
