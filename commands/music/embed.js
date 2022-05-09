const { MessageEmbed } = require("discord.js");

function createMusicEmbed() {
  const embed = new MessageEmbed();

  return embed;
}

module.exports = {
  notCommand: true,
  createMusicEmbed,
};
