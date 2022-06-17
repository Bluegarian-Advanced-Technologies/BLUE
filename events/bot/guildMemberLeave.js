const { PermissionsBitField } = require("discord.js");

const LEAVE_MSG = "**Leaving server...**\n\nThe Emperor of Bluegaria's almighty presence has left this unwhitelisted server.\n\n*Leaving automatically...*";

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
      const self = guild.members.me;
      await guild.channels.fetch();
      const messageSendableChannel = member.guild.channels.cache.find(
        (channel) => channel.isTextBased() && channel.permissionsFor(self).has(PermissionsBitField.Flags.SendMessages)
      );
      if (messageSendableChannel != null) await messageSendableChannel.send(LEAVE_MSG);

      await guild.leave();
    }
  },
};
