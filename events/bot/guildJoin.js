const { PermissionsBitField } = require("discord.js");

const BLUEGARIA_ABSENT_LEAVE_MSG = `— __**BOT USAGE DENIED**__ —\n\nThe Emperor of Bluegaria's presence is absent in this server, along with the fact that this server is not whitelisted.\n\n*Leaving server...*`;
const BLUEGARIA_HERE_UNWHITELISTED_LEAVE_MSG = `— __**BOT USAGE DENIED**__ —\n\nThis server has been blacklisted.\n\n*Leaving server...*`;

module.exports = {
  id: "guildJoin",
  once: false,
  eventType: "guildCreate",
  disableExempted: true,
  execute: async (guild, { client }) => {
    let bluegariaDetected = false;

    async function leaveServer() {
      await guild.channels.fetch();
      const messageSendableChannel = guild.channels.cache.find(
        (channel) => channel.isTextBased() && channel.permissionsFor(self).has(PermissionsBitField.Flags.SendMessages)
      );
      if (messageSendableChannel != null)
        if (bluegariaDetected) {
          messageSendableChannel.send(BLUEGARIA_HERE_UNWHITELISTED_LEAVE_MSG);
        } else {
          messageSendableChannel.send(BLUEGARIA_ABSENT_LEAVE_MSG);
        }

      await guild.leave();
      console.log(
        `\n----------------------------------\n! - Left unwhitelisted guild, info:\nGuild ID: ${guild.id}\nGuild Owner ID: ${guild.ownerId}\n----------------------------------`
      );
    }

    const server = client.BACH.servers.getAll().find((server) => server.guildId === guild.id);
    const self = guild.members.me;

    if (!(await guild.members.fetch(client.application.owner.id ?? client.application.owner.ownerId).catch(() => false))) {
      if (server == null || server.whitelisted === false) {
        await leaveServer();
      }
    } else {
      bluegariaDetected = true;
      if (server.whitelisted === false) {
        await leaveServer();
      }
    }
  },
};
