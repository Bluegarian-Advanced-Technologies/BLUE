const { Collection } = require("discord.js");

class CommandCooldownHandler {
  constructor() {
    this.cooldowns = new Collection();
  }

  get(id, commandName) {
    return this.cooldowns.get(id + commandName) ?? 0;
  }

  addCooldown(id, commandName, cooldown) {
    this.cooldowns.set(id + commandName, cooldown);

    setTimeout(() => {
      this.cooldowns.delete(id + commandName);
    }, cooldown * 1000);

    const ee = setInterval(() => {
      const e = this.cooldowns.get(id + commandName);
      if (e == null) return clearInterval(ee);
      this.cooldowns.set(id + commandName, e - 1);
    }, 1000);
  }

  validate(id, commandName) {
    return this.cooldowns.has(id + commandName);
  }
}

module.exports = CommandCooldownHandler;
