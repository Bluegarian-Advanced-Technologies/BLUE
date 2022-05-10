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

module.exports = { getAllFiles, embedMessage };
