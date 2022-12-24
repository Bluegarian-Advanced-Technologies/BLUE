import { ApplicationCommandOptionType, User } from "discord.js";
import Command from "../../classes/Command";

export default new Command({
  id: "user",
  description: "Configure users",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 4,
  disableExempted: true,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "elevation",
      description: "Configure user elevation (bot admin only)",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "Target user",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "_elevation",
          description: "Desired elevation 0-5",
          minValue: 0,
          maxValue: 5,
          required: true,
        },
      ],
    },
  ],
}, async (client, context) => {
  const users = client.bach.users;

  const targetUser = context.options[0] as User;

  switch (context.subcommand) {
    case "elevation": {
      const targetElevation = context.options[1] as number;

      if (targetUser.id === client.application!.owner!.id) {
        if (context.user.id === client.application!.owner!.id)
          return await context.embedReply(
            "Apologies my Emperor",
            "Your almighty highness will prevail for eternity: as such, I will not attempt to change your elevation.",
            "warn"
          );
        return await context.embedReply("Access Denied", "The Emperor's elevation cannot be changed.", "error");
      }

      if (users.getAll().find((u) => u.userId === targetUser.id)) {
        await users.update({ userId: targetUser.id }, { elevation: targetElevation });
      } else {
        await users.set({
          userId: targetUser.id,
          elevation: targetElevation,
        });
      }

      await context.embedReply("User updated", `Successfully updated user elevation to ${targetElevation}`, "ok");
    }
  }
});
