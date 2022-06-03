const { EmbedBuilder } = require("discord.js");
const { createEmbed } = require("../../utils");

/**
 *
 * @param {{
 *  thumbnail: string
 * }}
 */
function createMusicEmbed({ thumbnail, title, url, duration, requester }) {}

module.exports = {
  notCommand: true,
  createMusicEmbed,
};
