class ServerManager {
  constructor(client, servers) {
    this.client = client;
    this.servers = servers;
  }

  getAll() {
    return this.servers.getAll();
  }

  get data() {
    return this.servers;
  }

  async leaveServer(id) {
    const guild = this.client.guilds.cache.get(id);
    if (guild != null) {
      await guild.leave();
      return true;
    } else {
      return false;
    }
  }
}

module.exports = ServerManager;
