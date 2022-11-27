import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";

export default new Command({
  id: "server",
  description: "Configure servers (bot admin only)",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 5,
  disableExempted: true,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "modify",
      description: "Perform operations on servers",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "server_id",
          description: "The target server Snowflake",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "action",
          description: "The desired action to perform",
          required: true,
          choices: [
            {
              name: "Whitelist",
              value: "whitelist",
            },
            {
              name: "Blacklist",
              value: "blacklist",
            },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "list",
      description: "List all connected servers",
      options: [],
    },
  ],
  permissions: [],
}, async (client, context) => {
  switch (context.subcommand) {
    case "modify": {
      const guildId = (context.options[0] as string).toLowerCase() === "this" ? context.guild.id : context.options[0] as string;
      const action = context.options[1] as string;

      const servers = client.bach.servers.data;

      switch (action) {
        case "whitelist": {
          const server = servers.getAll().find((server) => server.guildId === guildId);

          if (server == null) {
            await servers.set({
              guildId: guildId,
              whitelisted: true,
            });
          } else {
            await servers.update({ guildId }, { whitelisted: true });
          }

          await context.embedReply("Server whitelisted", `Server with Snowflake ${guildId} has been successfully whitelisted.`, "ok");

          break;
        }
        case "blacklist": {
          const server = servers.getAll().find((server) => server.guildId === guildId);

          if (server == null) {
            await servers.set({
              guildId: guildId,
              whitelisted: false,
            });
          } else {
            await server.update({ guildId }, { whitelisted: false });
          }

          const result = await client.bach.servers.leaveServer(guildId);

          if (guildId !== context.guild.id) {
            await context.embedReply(
              "Server blacklisted",
              `Server with Snowflake ${guildId} has been successfully blacklisted. ${result ? "Additionally, the server has been left." : ""}`,
              "ok"
            );
          }

          break;
        }
      }
      break;
    }
    case "list": {
      let serverList = "";

      client.guilds.cache.forEach((server, i) => {
        serverList += `**${server.name}**: \`${server.id}\`\n`;
      });

      await context.embedReply(`Connected Servers (${client.guilds.cache.size})`, serverList);
    }
  }
});
