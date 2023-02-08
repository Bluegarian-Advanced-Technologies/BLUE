import Command from "../../classes/Command";

export default new Command(
  {
    id: "disconnect",
    description: "Disconnects from the voice channel",
    category: "Music",
    aliases: ["dc", "leave", "bye", "fuckoff"],
    slash: "both",
    permissions: ["Speak", "Connect"],
    options: [],
  },
  async (client, context) => {
    const vc = context.member.voice?.channel?.id;
    if (!vc) return await context.embedReply("Not connected to V.C.", "You must be connected to a voice channel to use this command.", "error");

    const player = client.audioManager.players.get(context.guild.id);

    if (!player) return await context.embedReply("Not connected to V.C.", "The bot is not connected to the voice channel.", "error");
    if (player.voiceChannel !== vc)
      return await context.embedReply("Not in corresponding V.C.", "You must be connected to the same voice channel as the bot to use this command.", "error");

    await context.embedReply("👋 Farewell");
    client.expectedAudioEvents.set(context.guild.id, "disconnect");
    player.destroy();
  }
);
