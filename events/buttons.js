module.exports = {
  id: "buttons",
  once: false,
  eventType: "interactionCreate",
  disableExempted: true,
  async execute(interaction, { client }) {
    if (!interaction.isButton()) return;
    if (interaction.customId.startsWith("pause_")) {
      const player = client.audioManager.players.get(interaction.guild?.id ?? "");
      if (player) player.pause(player.playing);
      interaction.deferUpdate();
    }
  },
};
