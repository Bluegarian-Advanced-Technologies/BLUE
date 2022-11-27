import Client from "./Client";
import LiveCollection from "./LiveCollection";

class ServerManager {
  client: Client;
  servers: LiveCollection;
  constructor(client: Client, servers: LiveCollection) {
    this.client = client;
    this.servers = servers;
  }

  getAll() {
    return this.servers.getAll();
  }

  get data() {
    return this.servers;
  }

  async leaveServer(id: string) {
    const guild = this.client.guilds.cache.get(id);
    if (guild != null) {
      await guild.leave();
      return true;
    } else {
      return false;
    }
  }
}

export default ServerManager;
