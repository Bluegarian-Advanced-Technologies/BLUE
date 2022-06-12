module.exports = {
  id: "user",
  description: "Configure users",
  category: "Emperor",
  aliases: [],
  slash: "both",
  hidden: true,
  elevation: 4,
  disableExempted: true,
  expectedArgs: [
    {
      type: "Subcommand",
      name: "elevation",
      description: "Configure user elevation (bot admin only)",
      expectedArgs: [
        {
          type: "User",
          name: "user",
          description: "Target user",
          required: true,
        },
        {
          type: "Integer",
          name: "_elevation",
          description: "Desired elevation 0-5",
          min: 0,
          max: 5,
          required: true,
        },
      ],
    },
  ],

  execute: async (cmd, { client, channel, user, args, subcommand, isInteraction, embedReply }) => {
    const users = client.BACH.users;

    let dynamicUser;
    if (isInteraction) {
      dynamicUser = args[0].id;
    } else {
      dynamicUser = args[0][1];
    }
    const targetUser = dynamicUser;

    switch (subcommand) {
      case "elevation": {
        const targetElevation = args[1];

        if (targetUser === client.application.owner.id) {
          if (user.id === client.application.owner.id)
            return await embedReply(
              "Apologies my Emperor",
              "Your almighty highness will prevail for eternity: as such, I will not attempt to change your elevation.",
              "warn"
            );
          return await embedReply("Access Denied", "The Emperor's elevation cannot be changed.", "error");
        }

        if (users.getAll().find((u) => u.userId === targetUser)) {
          users.update({ userId: targetUser }, { elevation: targetElevation }, (cache) => {
            return (cache.find((cachedUser) => cachedUser.userId === targetUser).elevation = targetElevation);
          });
        } else {
          users.set({
            userId: targetUser,
            elevation: targetElevation,
          });
        }

        await embedReply("User updated", `Successfully updated user elevation to ${targetElevation}`, "ok");
      }
    }
  },
};
