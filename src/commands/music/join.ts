import Command from "../../classes/Command";

export default new Command({
  id: "join",
  description: "Connects to your voice channel",
  category: "Music",
  aliases: ["connect"],
  slash: "both",
  permissions: ["Speak", "Connect"],
  options: []
}, async (client, context) => {
  const vc = context.member.voice?.channel?.id;
  if (!vc) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

  if (client.audioManager.players.get(context.guild.id) != null) return await context.embedReply("Already connected to V.C.");

  const player = client.audioManager.create({
    guild: context.guild.id,
    voiceChannel: vc,
    textChannel: context.channel.id,
  });

  player.connect();

  if (context.isTextBased()) {
    await context.message.react("☑");
  } else {
    await context.reply("☑", true);
  }
});
