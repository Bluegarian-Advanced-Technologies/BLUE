import { Collection } from "discord.js";

class CommandCooldownHandler {
  cooldowns: Collection<string, number>;
  constructor() {
    this.cooldowns = new Collection();
  }

  get(id: string, commandName: string) {
    return this.cooldowns.get(id + commandName) ?? 0;
  }

  addCooldown(id: string, commandName: string, cooldown: number) {
    this.cooldowns.set(id + commandName, cooldown);

    setTimeout(() => {
      this.cooldowns.delete(id + commandName);
    }, cooldown * 1000);

    const interval: NodeJS.Timer = setInterval(() => {
      const cooldown = this.cooldowns.get(id + commandName);
      if (cooldown == null) return clearInterval(interval);
      this.cooldowns.set(id + commandName, cooldown - 1);
    }, 1000);
  }

  validate(id: string, commandName: string) {
    return this.cooldowns.has(id + commandName);
  }
}

export default CommandCooldownHandler;
