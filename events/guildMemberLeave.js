module.exports = {
  id: "guildMemberLeave",
  once: false,
  eventType: "guildMemberRemove",
  disableExempted: true,
  execute: async (member, { client }) => {
    if (member.user.id !== client.application.owner.id ?? client.application.owner.ownerId) return;

    const guild = member.guild;
    const server = client.BACH.servers.getAll().find((serv) => serv.guildId === guild.id);

    if (server == null || server.whitelisted !== true) {
      await guild.leave();
    }
  },
};
