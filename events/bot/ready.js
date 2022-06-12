module.exports = {
  id: "ready",
  once: true,
  eventType: "ready",
  disableExempted: true,
  execute: async (event, { client }) => {
    // Init music manager
    client.audioManager.init(client.user.id);

    // Hardcode myself as almighty

    await client.application.fetch();

    const owner = client.BACH.users.getAll().find((user) => user.userId === client.application.owner.id);

    if (owner == null) {
      client.BACH.users.set({
        userId: client.application.owner.id,
        elevation: 5,
      });
    } else if (owner.elevation < 5) {
      client.BACH.users.update(
        {
          userId: client.application.owner.id,
        },
        {
          elevation: 5,
        },
        (cache) => {
          return (cache.find((user) => user.userId === client.application.owner.id).elevation = 5);
        }
      );
    }
  },
};
