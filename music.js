const { Manager } = require("erela.js");

module.exports = (client) => {
  client.manager = new Manager({
    nodes: [
      {
        host: "181.214.231.105",
        port: 6665,
        password: "syslink",
        secure: false,
      },
    ],
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  })
    .on("nodeConnect", (node) => console.log(`Node ${node.options.identifier} connected`))
    .on("nodeError", (node, error) => console.log(`Node ${node.options.identifier} had an error: ${error.message}`))
    .on("trackStart", (player, track) => {
      client.channels.cache.get(player.textChannel).send(`Now playing: ${track.title}`);
    })
    .on("queueEnd", (player) => {
      client.channels.cache.get(player.textChannel).send("Queue has ended.");

      player.destroy();
    });
  new Promise(async () => {
    while (true) {
      const s = client.ws.ping;
      client.ws.ping = s * 5;
      await new Promise((resolve) => setTimeout(resolve, s * 5));
    }
  });
};
