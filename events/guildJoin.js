const { Permissions } = require("discord.js");

const LiveCollection = require("../classes/LiveCollection");
const serverSchema = require("../models/server");

module.exports = {
  id: "guildJoin",
  once: false,
  eventType: "guildCreate",
  disableExempted: true,
  init: async (client) => {
    client.BACH.servers = new LiveCollection(serverSchema);
    await client.BACH.servers.init();
  },
  execute: async (guild, { client }) => {
    if (!(await guild.members.fetch(client.application.owner.id ?? client.application.owner.ownerId).catch(() => false))) {
      const server = client.BACH.servers.getAll().find((server) => server.guildId === guild.id);
      const self = await guild.me;

      if (server == null || server.whitelisted == false) {
        await guild.channels.fetch();
        const messageSendableChannel = guild.channels.cache.find(
          (channel) => channel.isText() && channel.permissionsFor(self).has(Permissions.FLAGS.SEND_MESSAGES)
        );
        if (messageSendableChannel != null)
          messageSendableChannel.send(
            "— __**BOT USAGE DENIED**__ —\n\nThe Emperor of Bluegaria's presence is absent in this server, along with the fact that this server is not whitelisted.\n\n*Leaving server...*"
          );

        await guild.leave();
        console.log(
          `----------------------------------\n! - Left unwhitelisted guild, info:\nGuild ID: ${guild.id}\nGuild Owner ID: ${guild.ownerId}\n----------------------------------`
        );
      }
    }
  },
};
