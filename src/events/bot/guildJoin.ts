import { ChannelType, GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import Event from "../../classes/Event";

const BLUEGARIA_ABSENT_LEAVE_MSG = `— __**BOT USAGE DENIED**__ —\n\nThe Emperor of Bluegaria's almighty presence is absent in this unwhitelisted server.\n\n*Leaving server...*`;
const BLUEGARIA_HERE_UNWHITELISTED_LEAVE_MSG = `— __**BOT USAGE DENIED**__ —\n\nThis server has been blacklisted.\n\n*Leaving server...*`;

export default new Event({
  id: "guildJoin",
  once: false,
  eventType: "guildCreate",
  disableExempted: true,
}, async (client, guild) => {
  let bluegariaDetected = false;

  const self = guild.members.me!;

  async function leaveServer() {
    await guild.channels.fetch();
    const messageSendableChannel = guild.channels.cache.find(
      (channel) => channel.type === ChannelType.GuildText && channel.permissionsFor(self).has(PermissionsBitField.Flags.SendMessages)
    ) as GuildTextBasedChannel;
    if (messageSendableChannel != null) {
      if (bluegariaDetected) {
        // Here but unwhitelisted
        await messageSendableChannel.send(BLUEGARIA_HERE_UNWHITELISTED_LEAVE_MSG);
      } else {
        // Not here, default
        await messageSendableChannel.send(BLUEGARIA_ABSENT_LEAVE_MSG);
      }
    }

    await guild.leave();
    console.log(
      `\n----------------------------------\n! - Left unwhitelisted guild, info:\nGuild ID: ${guild.id}\nGuild Owner ID: ${guild.ownerId}\n----------------------------------`
    );
  }

  const server = client.bach.servers.getAll().find((server) => server.guildId === guild.id);

  const owner = await guild.members.fetch(client.application!.owner!.id).catch(() => {});
  if (!owner) {
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
});
