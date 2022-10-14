import { ColorResolvable, EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

import settings from "./settings.json" assert { type: "json" };

export interface EmbedData {
  color?: ColorResolvable;
  title?: string;
  url?: string;
  author?: {
    name: string;
    url?: string;
    iconURL?: string;
  };
  description?: string;
  thumbnail?: string;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  image?: string;
  timestamp?: {
    date?: Date;
  };
  footer?: {
    text: string;
    iconURL?: string;
  };
}

export type ErrorLevel = "error" | "warn" | "ok";

import { fileURLToPath, pathToFileURL } from "url";

export const importDefault = async (path: string) => {
  // FIXME: MIGHT need to be converted to file URL
  const module = await import(pathToFileURL(path).toString());
  return module.default;
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const recursivelyGetFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = recursivelyGetFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;  
};

export const embedMessage = (title: string, text?: string, status?: ErrorLevel) => {
  let color: string;
  switch (status) {
    case "ok":
      color = settings.colors.ok;
      break;
    case "warn":
      color = settings.colors.warn;
      break;
    case "error":
      color = settings.colors.error;
      break;
    default:
      color = settings.colors.primary;
  }

  const embed = new EmbedBuilder().setColor(color as ColorResolvable);

  if (title) embed.setTitle(title.substring(0, 256));
  if (text) embed.setDescription(text.substring(0, 4096));

  return embed;
};

export const checkBoolean = (string: string) => {
  if (typeof string !== "string") return false;

  string = string.toLowerCase().trim();
  if (string !== "true" && string !== "false") throw new TypeError("Must be true or false string");

  return string === "true";
};

export const createEmbed = ({ color, title, url, author, description, thumbnail, fields, image, timestamp, footer }: EmbedData) => {
  const embed = new EmbedBuilder();

  if (fields && fields.length > 25) throw new RangeError("Cannot have more than 25 fields");

  if (color) embed.setColor(color);
  if (title) embed.setTitle(title.slice(0, 256));
  if (url) embed.setURL(url);
  if (author) embed.setAuthor({ ...author });
  if (description) embed.setDescription(description.slice(0, 4096));
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (fields) embed.addFields(fields);
  if (image) embed.setImage(image);
  if (timestamp) embed.setTimestamp(timestamp?.date ?? undefined);
  if (footer) embed.setFooter({ ...footer });

  return embed;
};

export const formatTime = (milliseconds: number, minimal = false) => {
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

interface MusicEmbedData {
  title: string;
  url: string;
  thumbnail?: string;
  status: string;
  duration: string;
  requester?: string;
  artist: string;
}

export const createMusicEmbed = ({ thumbnail, title, status, url, duration, artist, requester }: MusicEmbedData) => {
  return createEmbed({
    color: settings.colors.primary as ColorResolvable,
    author: { name: status },
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
        value: requester ? `<@${requester}>` : "Unknown user",
      },
    ],
  });
}

const validYTURLs = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
const validQueryDomains = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "gaming.youtube.com"]);
const idRegex = /^[a-zA-Z0-9-_]{11}$/;

export const validateVideoId = (id: string) => idRegex.test(id.trim());

export const validateVideoUrl = (link: string) => {
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
    if (!validateVideoId(id)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
