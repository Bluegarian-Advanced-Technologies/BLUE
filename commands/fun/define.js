const { MessageEmbed, MessageActionRow, MessageButton, MessageComponentInteraction, Permissions } = require("discord.js");
const { load } = require("cheerio");
const fetch = require("node-fetch");
const { colors } = require("../../config.json");
/**
 * @type {Map<string, InteractionCollector<MessageComponentInteraction>>}
 */
const activeChannelCollectors = new Map();
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
const activeDefinitions = new Map();

function createUrbanDictEmbed(definition) {
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
function createDictEmbed(definition, innerIndex = 0) {
  const embed = new MessageEmbed()
    .setTitle(`Definition of "${definition.word}"`)
    .setColor(colors.primary)
    .setDescription(definition.definitions[innerIndex])
    .addFields({
      name: "Part of Speech",
      value: definition.partOfSpeech,
    });

  if (definition.textPhonetic != null) embed.addField("Pronunciation", definition.textPhonetic);
  if (definition.synonyms.length !== 0) embed.addField("Synonyms", definition.synonyms.join(", "), true);
  if (definition.antonyms.length !== 0) embed.addField("Antonyms", definition.antonyms.join(", "), true);

  return embed;
}
async function getDictWord(word = "") {
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

  return false;
}

// function getCollector(channel) {
//   const collector = this.activeChannelCollectors.get(channel.id);
//   if (collector == null) {
//     const newCollector = channel.createMessageComponentCollector({ idle: 100000 });
//     this.activeChannelCollectors.set(channel.id, newCollector);
//     return newCollector;
//   }
//   return collector;
// }

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

  execute: async (cmd, { args, reply, channel, channelId, member, user, embedReply }) => {
    const word = args[0].toLowerCase();
    const isUrban = args[1] == null ? false : true;

    let definitionPagesRaw = isUrban ? await getUrbanDictWord(word) : await getDictWord(word);

    if (!isUrban && definitionPagesRaw === false) {
      definitionPagesRaw = await getUrbanDictWord(word);
      if (definitionPagesRaw === false) {
        return embedReply("No definition found", `Could not find definitions for word "${word}"`);
      }
    } else if (definitionPagesRaw === false) {
      return embedReply("No definition found", `Could not find definitions for word "${word}"`);
    }

    const rawComponents = [
      new MessageButton().setCustomId("prev").setLabel("Previous").setStyle("PRIMARY").setDisabled(true),
      new MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY"),
    ];
    if (!isUrban) {
      rawComponents.push(
        new MessageButton().setCustomId("prevdef").setLabel("-").setStyle("SECONDARY").setDisabled(true),
        new MessageButton().setCustomId("nextdef").setLabel("+").setStyle("SECONDARY")
      );
    }

    const components = new MessageActionRow().addComponents(...rawComponents);

    const embedDefinition = isUrban ? createUrbanDictEmbed(definitionPagesRaw[0]) : createDictEmbed(definitionPagesRaw[0]);

    const message = await reply(null, false, {
      embeds: [embedDefinition],
      components: [components],
      fetchReply: true,
    });

    activeDefinitions.set(message.id, {
      isUrban,
      index: 0,
      innerIndex: isUrban ? null : 0,
      definitions: definitionPagesRaw,
    });

    const collector = message.createMessageComponentCollector({ idle: 100000 });
    collector.on("collect", async (i) => {
      if (i.user.id !== user.id && !member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
        return i.reply({ content: "Sorry, but this isn't your defintion panel.", ephemeral: true });

      const activeDefinition = activeDefinitions.get(message.id);

      if (activeDefinition.isUrban) {
        switch (i.customId) {
          case "prev": {
            break;
          }
          case "next": {
            break;
          }
        }
      } else {
        if (activeDefinition.definitions.length === activeDefinition.index + 2) {
          rawComponents[1].setDisabled(true);
        } else {
          rawComponents[1].setDisabled(false);
        }
        if (activeDefinition.index - 1 === 0) {
          rawComponents[0].setDisabled(true);
        } else {
          rawComponents[0].setDisabled(false);
        }

        switch (i.customId) {
          case "prev": {
            if (activeDefinition.index === 0) return console.log("Start"); // TODO: Add beginning message
            activeDefinition.innerIndex = 0;

            --activeDefinition.index;
            await i.update({
              embeds: [createDictEmbed(activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [new MessageActionRow().addComponents(...rawComponents)],
            });
            break;
          }
          case "next": {
            if (activeDefinition.definitions.length === activeDefinition.index + 1) return; // TODO: Add end message

            activeDefinition.innerIndex = 0;

            ++activeDefinition.index;
            await i.update({
              embeds: [createDictEmbed(activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [new MessageActionRow().addComponents(...rawComponents)],
            });
            break;
          }
          case "prevdef": {
            if (activeDefinition.innerIndex === 0) return console.log("Start"); // TODO: Add beginning message

            --activeDefinition.innerIndex;
            await i.update({
              embeds: [createDictEmbed(activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [new MessageActionRow().addComponents(...rawComponents)],
            });

            break;
          }
          case "nextdef": {
            if (activeDefinition.definitions[activeDefinition.index].definitions.length === activeDefinition.innerIndex + 1) return; // TODO: Add end message

            ++activeDefinition.innerIndex;
            await i.update({
              embeds: [createDictEmbed(activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [new MessageActionRow().addComponents(...rawComponents)],
            });
          }
        }
      }
    });

    collector.on("end", () => {
      message.edit({
        components: [],
      });
    });
  },
};
