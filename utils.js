const fs = require("fs");
const path = require("path");

const config = require("./config.json");

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const { MessageEmbed } = require("discord.js");
const { colors } = config;

function embedMessage(title = "", text = "", status = "") {
  let color;
  switch (status) {
    case "ok":
      color = colors.ok;
      break;
    case "warn":
      color = colors.warn;
      break;
    case "error":
      color = colors.error;
      break;
    default:
      color = colors.primary;
  }

  const embed = new MessageEmbed().setColor(color);

  if (title) embed.setTitle(title.substring(0, 256));
  if (text) embed.setDescription(text.substring(0, 4096));

  return embed;
}

function checkBoolean(string = "") {
  if (typeof string !== "string") return false;

  string = string.toLowerCase().trim();
  if (string !== "true" && string !== "false")
    return new Error("Must be true or false string");

  return string === "true";
}

function createEmbed({
  color = "",
  title = "",
  url = "",
  author = {},
  description = "",
  thumbnail = "",
  fields = [],
  image = "",
  timestamp = {},
  footer = {},
}) {
  const embed = new MessageEmbed();

  if (color != null) embed.setColor(color);
  if (title != null) embed.setTitle(title);
  if (url != null) embed.setURL(url);
  if (author != null) embed.setColor({...author});
  if (description != null) embed.setDescription(description.slice(0, 4096));
  if (thumbnail != null) embed.setThumbnail(thumbnail);
  if (fields != null) embed.addFields(...fields);
  if (image != null) embed.setImage(image);
  if (image != null) embed.setImage(image);
  if (timestamp != null) embed.setTimestamp(timestamp.date ?? undefined);
  if (footer != null) embed.setFooter(...footer);

  return embed;
}

module.exports = { getAllFiles, embedMessage, checkBoolean, createEmbed };
