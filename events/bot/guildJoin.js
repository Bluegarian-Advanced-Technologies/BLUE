const { PermissionsBitField } = require("discord.js");
const { ChannelType } = require("discord-api-types/v10");

const BLUEGARIA_ABSENT_LEAVE_MSG = `— __**BOT USAGE DENIED**__ —\n\nThe Emperor of Bluegaria's almighty presence is absent in this unwhitelisted server.\n\n*Leaving server...*`;
const BLUEGARIA_HERE_UNWHITELISTED_LEAVE_MSG = `— __**BOT USAGE DENIED**__ —\n\nThis server has been blacklisted.\n\n*Leaving server...*`;

module.exports = {
  id: "guildJoin",
  once: false,
  eventType: "guildCreate",
  disableExempted: true,
  execute: async (guild, { client }) => {
    let bluegariaDetected = false;

    const self = guild.members.me;

    async function leaveServer() {
      await guild.channels.fetch();
      const messageSendableChannel = guild.channels.cache.find(
        (channel) => channel.type === ChannelType.GuildText && channel.permissionsFor(self).has(PermissionsBitField.Flags.SendMessages)
      );
      if (messageSendableChannel != null) {
        if (bluegariaDetected) {
          await messageSendableChannel.send(BLUEGARIA_HERE_UNWHITELISTED_LEAVE_MSG);
        } else {
          await messageSendableChannel.send(BLUEGARIA_ABSENT_LEAVE_MSG);
        }
      }

      await guild.leave();
      console.log(
        `\n----------------------------------\n! - Left unwhitelisted guild, info:\nGuild ID: ${guild.id}\nGuild Owner ID: ${guild.ownerId}\n----------------------------------`
      );
    }

    const server = client.BACH.servers.getAll().find((server) => server.guildId === guild.id);

    if (!(await guild.members.fetch(client.application.owner.id ?? client.application.owner.ownerId).catch(() => false))) {
      if (server == null || server.whitelisted === false) {
        try {
          await leaveServer();
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      bluegariaDetected = true;
      if (server != null && server?.whitelisted === false) {
        try {
          await leaveServer();
        } catch (err) {
          console.error(err);
        }
      }
    }
  },
};
