module.exports = {
  id: "managerInit",
  once: true,
  eventType: "ready",
  execute: async (event, { client }) => {
    client.manager.init(client.user.id);
  },
};
