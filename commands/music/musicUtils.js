const { EmbedBuilder } = require("discord.js");
const { createEmbed } = require("../../utils");

const { colors } = require("../../config.json");

/**
 *
 * @param {{
 *  thumbnail: string
 * }}
 */
function createMusicEmbed({ thumbnail, title, status, url, duration, artist, requester }) {
  return createEmbed({
    color: colors.primary,
    author: { name: status, url: null },
    title: title,
    url,
    thumbnail: thumbnail?.replace("default", "hqdefault"),
    fields: [
      {
        name: "Length",
        value: duration,
        inline: true,
      },
      {
        name: "Artist",
        value: artist,
        inline: true,
      },
      {
        name: "\u200B",
        value: `<@${requester}>`,
      },
    ],
  });
}

const validYTURLs = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const validQueryDomains = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "gaming.youtube.com"]);
const idRegex = /^[a-zA-Z0-9-_]{11}$/;

function validateID(id) {
  return idRegex.test(id.trim());
}

function validateYTURL(link) {
  try {
    const parsed = new URL(link.trim());
    let id = parsed.searchParams.get("v");
    if (validYTURLs.test(link.trim()) && !id) {
      const paths = parsed.pathname.split("/");
      id = parsed.host === "youtu.be" ? paths[1] : paths[2];
    } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname)) {
      return false;
    }
    if (!id) {
      return false;
    }
    id = id.substring(0, 11);
    if (!validateID(id)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  notCommand: true,
  createMusicEmbed,
  validateYTURL,
};
