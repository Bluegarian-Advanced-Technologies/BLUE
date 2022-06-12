module.exports = {
  id: "server",
  description: "Configure servers (bot admin only)",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 5,
  disableExempted: true,
  expectedArgs: [
    {
      type: "Subcommand",
      name: "modify",
      description: "Perform operations on servers",
      expectedArgs: [
        {
          type: "String",
          name: "server_id",
          description: "The target server Snowflake",
          required: true,
        },
        {
          type: "String",
          name: "action",
          description: "The desired action to perform",
          required: true,
          options: [
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
      type: "Subcommand",
      name: "list",
      description: "List all connected servers",
      expectedArgs: [],
    },
  ],

  execute: async (cmd, { client, guildId, subcommand, embedReply, args }) => {
    switch (subcommand) {
      case "modify": {
        const serverId = args[0].toLowerCase() === "this" ? guildId : args[0];
        const action = args[1];

        const servers = client.BACH.servers.data;

        switch (action) {
          case "whitelist": {
            const server = servers.getAll().find((server) => server.guildId === serverId);

            if (server == null) {
              servers.set({
                guildId: serverId,
                whitelisted: true,
              });
            } else {
              servers.update({ guildId: serverId }, { whitelisted: true }, (cache) => {
                cache.find((server) => server.guildId === serverId).whitelisted = true;
              });
            }

            embedReply("Server whitelisted", `Server with Snowflake ${serverId} has been successfully whitelisted.`, "ok");

            break;
          }
          case "blacklist": {
            const server = servers.getAll().find((server) => server.guildId === serverId);

            if (server == null) {
              servers.set({
                guildId: serverId,
                whitelisted: false,
              });
            } else {
              await server.update({ guildId: serverId }, { whitelisted: false }, (cache) => {
                cache.find((server) => server.guildId === serverId).whitelisted = false;
              });
            }

            const result = await client.BACH.servers.leaveServer(serverId);

            if (serverId !== guildId) {
              embedReply(
                "Server blacklisted",
                `Server with Snowflake ${serverId} has been successfully blacklisted. ${result ? "Additionally, the server has been left." : ""}`,
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

        embedReply(`Connected Servers (${client.guilds.cache.size})`, serverList);
      }
    }
  },
};
