import { GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import Event from "../../classes/Event";

const LEAVE_MSG = "**Leaving server...**\n\nThe Emperor of Bluegaria's almighty presence has left this unwhitelisted server.\n\n*Leaving automatically...*";

export default new Event({
  id: "guildMemberLeave",
  once: false,
  eventType: "guildMemberRemove",
  disableExempted: true,
}, async (client, member) => {
  if (member.user.id !== client.application!.owner!.id) return;

  const guild = member.guild;
  const server = client.bach.servers.getAll().find((serv) => serv.guildId === guild.id);

  if (server == null || server.whitelisted !== true) {
    const self = guild.members.me!;
    await guild.channels.fetch();
    const messageSendableChannel = member.guild.channels.cache.find(
      (channel) => channel.isTextBased() && channel.permissionsFor(self).has(PermissionsBitField.Flags.SendMessages)
    ) as GuildTextBasedChannel;
    if (messageSendableChannel != null) await messageSendableChannel.send(LEAVE_MSG);

    await guild.leave();
  }
});
