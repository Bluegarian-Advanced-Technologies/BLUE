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

const { EmbedBuilder } = require("discord.js");
const { colors } = config;

function embedMessage(title, text, status = "") {
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

  const embed = new EmbedBuilder().setColor(color);

  if (title) embed.setTitle(title.substring(0, 256));
  if (text) embed.setDescription(text.substring(0, 4096));

  return embed;
}

function checkBoolean(string = "") {
  if (typeof string !== "string") return false;

  string = string.toLowerCase().trim();
  if (string !== "true" && string !== "false") return new Error("Must be true or false string");

  return string === "true";
}

function createEmbed({ color, title, url, author, description, thumbnail, fields, image, timestamp, footer }) {
  const embed = new EmbedBuilder();

  if (fields.length > 25) return new Error("Cannot have more than 25 fields");

  if (color != null) embed.setColor(color);
  if (title != null) embed.setTitle(title.slice(0, 256));
  if (url != null) embed.setURL(url);
  if (author != null) embed.setAuthor({ ...author });
  if (description != null) embed.setDescription(description.slice(0, 4096));
  if (thumbnail != null) embed.setThumbnail(thumbnail);
  if (fields != null) embed.addFields(fields);
  if (image != null) embed.setImage(image);
  if (timestamp != null) embed.setTimestamp(timestamp?.date ?? undefined);
  if (footer != null) embed.setFooter({ ...footer });

  return embed;
}

const formatMS = (milliseconds, minimal = false) => {
  if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) {
    throw new RangeError("formatTime(milliseconds: number) Milliseconds must be a number greater than 0");
  }
  if (typeof minimal !== "boolean") {
    throw new TypeError("formatTime(milliseconds: number, minimal: boolean) Minimal must be a boolean");
  }
  const times = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  while (milliseconds > 0) {
    if (milliseconds - 31557600000 >= 0) {
      milliseconds -= 31557600000;
      times.years++;
    } else if (milliseconds - 2628000000 >= 0) {
      milliseconds -= 2628000000;
      times.months++;
    } else if (milliseconds - 604800000 >= 0) {
      milliseconds -= 604800000;
      times.weeks += 7;
    } else if (milliseconds - 86400000 >= 0) {
      milliseconds -= 86400000;
      times.days++;
    } else if (milliseconds - 3600000 >= 0) {
      milliseconds -= 3600000;
      times.hours++;
    } else if (milliseconds - 60000 >= 0) {
      milliseconds -= 60000;
      times.minutes++;
    } else {
      times.seconds = Math.round(milliseconds / 1000);
      milliseconds = 0;
    }
  }
  const finalTime = [];
  let first = false;
  for (const [k, v] of Object.entries(times)) {
    if (minimal) {
      if (v === 0 && !first) {
        continue;
      }
      finalTime.push(v < 10 ? `0${v}` : `${v}`);
      first = true;
      continue;
    }
    if (v > 0) {
      finalTime.push(`${v} ${v > 1 ? k : k.slice(0, -1)}`);
    }
  }
  let time = finalTime.join(minimal ? ":" : ", ");
  if (time.includes(",")) {
    const pos = time.lastIndexOf(",");
    time = `${time.slice(0, pos)} and ${time.slice(pos + 1)}`;
  }
  return time;
};

module.exports = { getAllFiles, embedMessage, checkBoolean, createEmbed, formatMS };
