const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageComponentInteraction, PermissionsBitField } = require("discord.js");
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
  const embed = new EmbedBuilder().setTitle(`Definition of "${definition.word}"`).setDescription(`Lorem`).setColor(colors.primary);

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
function createDictEmbed(raw, definition, innerIndex = 0) {
  const embed = new EmbedBuilder()
    .setTitle(`Definition of "${definition.word}"`)
    .setColor(colors.primary)
    .setDescription(definition.definitions[innerIndex])
    .setFooter({
      text: `Page ${(raw.index ?? 0) + 1}/${raw.definitions?.length ?? raw.length} | Def. ${innerIndex + 1}/${definition.definitions?.length}`,
    });

  const fields = [];

  if (definition.textPhonetic != null) fields.push({ name: "Pronunciation", value: definition.textPhonetic });
  if (definition.synonyms.length !== 0) fields.push({ name: "Synonyms", value: definition.synonyms.join(", "), inline: true });
  if (definition.antonyms.length !== 0) fields.push({ name: "Antonyms", value: definition.antonyms.join(", "), inline: true });

  embed.addFields([
    {
      name: "Part of Speech",
      value: definition.partOfSpeech,
    },
    ...fields,
  ]);

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
    let isUrban = args[1] == null ? false : true;

    let definitionPagesRaw = isUrban ? await getUrbanDictWord(word) : await getDictWord(word);

    if (!isUrban && args[1] !== false && definitionPagesRaw === false) {
      definitionPagesRaw = await getUrbanDictWord(word);
      if (definitionPagesRaw === false) {
        return embedReply("No definition found", `Could not find definitions for word "${word}"`);
      }

      isUrban = true;
    } else if (definitionPagesRaw === false) {
      return embedReply("No definition found", `Could not find definitions for word "${word}"`);
    }

    const rawComponents = [
      new ButtonBuilder().setCustomId("prev").setLabel("Previous").setStyle("Primary").setDisabled(true),
      new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle("Primary"),
    ];
    if (!isUrban) {
      rawComponents.push(
        new ButtonBuilder().setCustomId("prevdef").setLabel("-").setStyle("Secondary").setDisabled(true),
        new ButtonBuilder().setCustomId("nextdef").setLabel("+").setStyle("Secondary")
      );
    }

    if (definitionPagesRaw.length < 2) rawComponents[1].setDisabled(true);
    if (definitionPagesRaw?.definitions?.length < 2) rawComponents[3].setDisabled(true);

    const components = new ActionRowBuilder().setComponents(rawComponents);

    const embedDefinition = isUrban
      ? createUrbanDictEmbed(definitionPagesRaw, definitionPagesRaw[0])
      : createDictEmbed(definitionPagesRaw, definitionPagesRaw[0]);

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
      if (i.user.id !== user.id && !member.permissions.has(PermissionsBitField.Flags.Administrator))
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
        function checkButtons() {
          if (activeDefinition.definitions.length === activeDefinition.index + 1) {
            components.components[1].setDisabled(true);
          } else {
            components.components[1].setDisabled(false);
          }
          if (activeDefinition.index === 0) {
            components.components[0].setDisabled(true);
          } else {
            components.components[0].setDisabled(false);
          }
          if (activeDefinition.definitions[activeDefinition.index].definitions.length === activeDefinition.innerIndex + 1) {
            components.components[3].setDisabled(true);
          } else {
            components.components[3].setDisabled(false);
          }
          if (activeDefinition.innerIndex === 0) {
            components.components[2].setDisabled(true);
          } else {
            components.components[2].setDisabled(false);
          }
        }

        switch (i.customId) {
          case "prev": {
            if (activeDefinition.index === 0) return i.reply({ content: "Reached start of pages", ephemeral: true });
            activeDefinition.innerIndex = 0;

            --activeDefinition.index;
            checkButtons();
            await i.update({
              embeds: [createDictEmbed(activeDefinition, activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [components],
            });
            break;
          }
          case "next": {
            if (activeDefinition.definitions.length === activeDefinition.index + 1) return i.reply({ content: "Reached end of pages", ephemeral: true });
            activeDefinition.innerIndex = 0;

            ++activeDefinition.index;
            checkButtons();
            await i.update({
              embeds: [createDictEmbed(activeDefinition, activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [components],
            });
            break;
          }
          case "prevdef": {
            if (activeDefinition.innerIndex === 0) return i.reply({ content: "Reached start of definitions", ephemeral: true });

            --activeDefinition.innerIndex;
            checkButtons();
            await i.update({
              embeds: [createDictEmbed(activeDefinition, activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [components],
            });

            break;
          }
          case "nextdef": {
            if (activeDefinition.definitions[activeDefinition.index].definitions.length === activeDefinition.innerIndex + 1)
              return i.reply({ content: "Reached end of definitions", ephemeral: true });

            ++activeDefinition.innerIndex;
            checkButtons();
            await i.update({
              embeds: [createDictEmbed(activeDefinition, activeDefinition.definitions[activeDefinition.index], activeDefinition.innerIndex)],
              components: [components],
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
