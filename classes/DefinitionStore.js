const { InteractionCollector, MessageComponentInteraction, MessageEmbed, TextChannel } = require("discord.js");
const { load } = require("cheerio");
const fetch = require("node-fetch");
const { colors } = require("../config.json");

// DefinitionResult

class DefinitionStore {
  constructor() {
    /**
     * @type {Map<string, InteractionCollector<MessageComponentInteraction>>}
     */
    this.activeChannelCollectors = new Map();
    /**
      * @type {Map<string, {
          isUrban: boolean,
          index: number,
          innerIndex: number | null,
          definitions: {
            word: string,
            definitions: string[],
            partOfSpeech: string,
            synonyms: string[],
            antonyms: string[],
            textPhonetic: string
          }
        }>}
      */
    this.activeDefinitions = new Map();
  }
  createUrbanDictEmbed(definition) {
    const embed = new MessageEmbed().setTitle(`Definition of "${definition.word}"`).setDescription(`Lorem`).setColor(colors.primary);

    return embed;
  }
  /**
   * @param definition {{
      word: string,
      definitions: string[],
      partOfSpeech: string,
      synonyms: string[],
      antonyms: string[],
      textPhonetic: string
    }}
   */
  createDictEmbed(definition) {
    const embed = new MessageEmbed()
      .setTitle(`Definition of "${definition.word}"`)
      .setColor(colors.primary)
      .setDescription(definition.definitions[0])
      .addFields({
        name: "Part of Speech",
        value: definition.partOfSpeech,
      });

    if (definition.textPhonetic != null) embed.addField("Pronunciation", definition.textPhonetic);
    if (definition.synonyms.length !== 0) embed.addField("Synonyms", definition.synonyms.join(", "), true);
    if (definition.antonyms.length !== 0) embed.addField("Antonyms", definition.antonyms.join(", "), true);

    return embed;
  }
  async getDictWord(word = "") {
    const result = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word).catch((err) => console.error(err));

    switch (result.status) {
      case 404:
        return false;
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

    return pages;
  }
  async getUrbanDictWord(word = "") {
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

    return false;
  }
  /**
   * @param channel {TextChannel}
   */
  getCollector(channel) {
    const collector = this.activeChannelCollectors.get(channel.id);
    if (collector == null) {
      const newCollector = channel.createMessageComponentCollector({ idle: 100000 });
      this.activeChannelCollectors.set(channel.id, newCollector);
      return newCollector;
    }
    return collector;
  }
}

module.exports = DefinitionStore;
