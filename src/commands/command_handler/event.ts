import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";

export default new Command({
  id: "event",
  description: "Enable or disable events",
  category: "Moderation",
  slash: "both",
  aliases: [],
  disableExempted: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "action",
      description: "Enable or disable event",
      choices: [
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
      type: ApplicationCommandOptionType.String,
      name: "event",
      description: "Targeted event",
      required: true,
    },
  ],

  permissions: ["ManageGuild"],
}, async (client, context) => {
    const targetEvent = (context.options[1] as string).toLowerCase();

    let event = client.bach.events.get(targetEvent);

    if (event == null) return await context.embedReply("Event non-existent", undefined, "warn");

    if (event.disableExempted) return await context.embedReply("Cannot disable event", "This event is exempted from being disabled.", "error");

    const cachedServer = client.bach.disabledEvents.getAll().find((doc) => doc.guildId === context.guild.id);

    switch (context.options[0]) {
      case "on":
        if (!cachedServer || !cachedServer.events.includes(targetEvent))
          return await context.embedReply("Event not disabled", "Cannot enable already enabled event", "warn");

        const events = cachedServer.events;

        for (let i = 0; i < events.length; i++) {
          if (events[i] === targetEvent) {
            events.splice(i, 1);
            break;
          }
        }

        await client.bach.disabledEvents.update({ guildId: context.guild.id }, { events });

        await context.embedReply(`Event '${targetEvent}' enabled`, "Successfully enabled event", "ok");

        break;
      case "off":
        if (!cachedServer) {
          client.bach.disabledEvents.set({
            guildId: context.guild.id,
            events: [targetEvent],
          });

          await context.embedReply(`Event '${targetEvent}' disabled`, "Successfully disabled event", "ok");
        } else {
          if (cachedServer.events.includes(targetEvent)) return await context.embedReply("Event already disabled", "Cannot disable already disabled event", "warn");
          
          const events = cachedServer.events;
          events.push(targetEvent);

          await client.bach.disabledEvents.update({ guildId: context.guild.id }, { events });

          context.embedReply(`Event '${targetEvent}' disabled`, "Successfully disabled event", "ok");
        }
        break;
    }
});