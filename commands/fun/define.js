const { load } = require("cheerio");
const fetch = require("node-fetch");

const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const { colors } = require("../../config.json");

function createDictEmbed(definition) {
  const embed = new MessageEmbed().setTitle(`Definition of "${definition.word}"`).setColor(colors.primary).setDescription(definition.definitions[0]).addFields({
    name: "Part of Speech",
    value: definition.partOfSpeech,
  });

  if (definition.textPhonetic != null) embed.addField("Pronunciation", definition.textPhonetic);
  if (definition.synonyms.length !== 0) embed.addField("Synonyms", definition.synonyms.join(", "), true);
  if (definition.antonyms.length !== 0) embed.addField("Antonyms", definition.antonyms.join(", "), true);

  return embed;
}

async function getDictWord(word = "") {
  const result = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word).catch((err) => {
    return console.error(err);
  });

  switch (result.status) {
    case 404:
      return false;
      break;
  }

  const rawDefs = await result.json();

  const definition = rawDefs[0];

  const pages = [];

  definition.meanings.forEach((meaning) => {
    const defs = [];

    meaning.definitions.forEach((def) => {
      defs.push(def.definition);
    });

    pages.push({
      word: definition.word,
      partOfSpeech: meaning?.partOfSpeech,
      definitions: defs,
      synonyms: meaning?.synonyms ?? [],
      antonyms: meaning?.antonyms ?? [],
      textPhonetic: definition?.phonetic,
    });
  });

  return pages[0];
}

function createUrbanDictEmbed(definition) {
  const embed = new MessageEmbed().setColor(colors.primary);

  return embed;
}

async function getUrbanDictWord(word = "") {
  const html = await (await fetch(`https://www.urbandictionary.com/define.php?term=${word}`)).text();
  const $ = load(html);

  const definitions = $("div.meaning");
  const authors = $("div.contributor > a");
  const examples = $("div.example");
  const ids = $("div.definition")?.attr("data-defid");

  const definitionPages = [];

  for (let i = 0; i < definitions.length; i++) {
    const definition = definitions[i];
  }

  // const data = await fetch(`https://api.urbandictionary.com/v0/uncacheable?ids=${ids}`);
  // const json = await data.json();
  // const upvotes = json.thumbs[0]?.up ?? "";
  // const downvotes = json.thumbs[0]?.down ?? "";

  // const pages = [
  //   {
  //     author,
  //     definition,
  //     example,
  //     id,
  //     upvotes,
  //     downvotes,
  //   },
  // ];

  // console.log(definitions);

  // return pages;
}

module.exports = {
  id: "define",
  description: "Recieve definitions of words",
  category: "Fun",
  aliases: ["def"],
  slash: "both",
  expectedArgs: [
    {
      type: "String",
      name: "word",
      description: "The word to be defined",
      required: true,
    },
    {
      type: "Boolean",
      name: "urban",
      description: "Force urban dictionary check of definition",
    },
  ],

  execute: async (cmd, { args, reply, channel, embedReply }) => {
    const word = args[0].toLowerCase();
    const urbanOption = args[1];

    let definitionPagesRaw = urbanOption ? getUrbanDictWord(word) : getDictWord(word);

    if (!urbanOption && definitionPagesRaw === false) {
      definitionPagesRaw = getUrbanDictWord(word);
    } else {
      // No word found
    }

    const components = new MessageActionRow().addComponents(
      new MessageButton().customId("prev").setLabel("Previous").setStyle("SECONDARY"),
      new MessageButton().customId("next").setLabel("Next").setStyle("PRIMARY")
    );

    const collector = channel.createMessageComponentCollector({ time: 150000 });
    collector.on("collect", async (i) => {
      switch (i.customId) {
        case "prev": {
          break;
        }
        case "next": {
          break;
        }
      }
    });

    reply(null, false, {
      embeds: [],
      components: [components],
    });
  },
};
