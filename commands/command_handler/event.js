const { embedMessage } = require("../../utils");

module.exports = {
  id: "event",
  description: "Enable or disable events",
  category: "Moderation",
  slash: "both",
  aliases: [],
  disableExempted: true,
  expectedArgs: [
    {
      type: "String",
      name: "action",
      description: "Enable or disable event",
      options: [
        {
          name: "Enable",
          value: "on",
        },
        {
          name: "Disable",
          value: "off",
        },
      ],
      required: true,
    },
    {
      type: "String",
      name: "event",
      description: "Targeted event",
      required: true,
    },
  ],

  permissions: ["MANAGE_GUILD"],

  execute: async (cmd, { client, guildId, embedReply, args }) => {
    const targetEvent = args[1].toLowerCase();

    if (!client.BACH.events.find((event) => event === targetEvent)) return embedReply("Event non-existent", null, "warn");
    if (targetCommand.disableExempted) return embedReply("Cannot disable command", "This command is exempted from being disabled.", "error");

    const cachedServer = client.BACH.disabledEvents.getAll().find((doc) => doc.guildId === guildId);

    switch (args[0]) {
      case "on":
        if (!cachedServer || !cachedServer.events.includes(targetEvent)) return embedReply("Event not disabled", "Cannot enable already enabled event", "warn");

        client.BACH.disabledEvents.update({ guildId }, { $pull: { events: targetEvent } }, (servers) => {
          const targetServer = servers.find((server) => server.guildId === guildId);

          for (let i = 0; i < targetServer.events.length; ++i) {
            if (targetServer.events[i] === targetEvent) {
              targetServer.events.splice(i, 1);
              break;
            }
          }

          embedReply(`Event '${targetEvent}' enabled`, "Successfully enabled event", "ok");
        });

        break;
      case "off":
        if (!cachedServer) {
          client.BACH.disabledEvents.set({
            guildId,
            events: [targetEvent],
          });

          embedReply(`Event '${targetEvent}' disabled`, "Successfully disabled event", "ok");
        } else {
          if (cachedServer.events.includes(targetEvent)) return embedReply("Event already disabled", "Cannot disable already disabled event", "warn");
          client.BACH.disabledEvents.update({ guildId }, { $push: { events: targetEvent } }, (servers) => {
            servers.find((server) => server.guildId === guildId).events.push(targetEvent);
          });

          embedReply(`Event '${targetEvent}' disabled`, "Successfully disabled event", "ok");
        }
        break;
      default:
        reply("bruh");
    }
  },
};
