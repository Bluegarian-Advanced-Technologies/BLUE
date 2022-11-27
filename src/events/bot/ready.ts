import Event from "../../classes/Event";

export default new Event({
  id: "ready",
  once: true,
  eventType: "ready",
  disableExempted: true,
}, async (client) => {
    // Init music manager
    client.audioManager.init(client.user!.id);

    // Hardcode myself as almighty

    await client.application!.fetch();

    const owner = client.bach.users.getAll().find((user) => user.userId === client.application!.owner!.id);

    if (owner == null) {
      client.bach.users.set({
        userId: client.application!.owner!.id,
        elevation: 5,
      });
    } else if (owner.elevation < 5) {
      client.bach.users.update({
        userId: client.application!.owner!.id,
      }, {
        elevation: 5,
      });
    }
});
