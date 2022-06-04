const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageComponentInteraction, PermissionsBitField } = require("discord.js");
const { load } = require("cheerio");
const fetch = require("node-fetch");
const { colors } = require("../../config.json");

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

function createUrbanDictEmbed(raw, definition) {
  const embed = new EmbedBuilder()
    .setTitle(`Definition of "${definition.word}"`)
    .setDescription(definition.definition)
    .setColor(colors.primary)
    .setFooter({
      text: `Page ${(raw.index ?? 0) + 1}/${raw.definitions?.length ?? raw.length}`,
    });

  embed.addFields([
    {
      name: "Example",
      value: definition.example,
    },
    {
      name: "Upvotes",
      value: definition.upvotes,
      inline: true,
    },
    {
      name: "Downvotes",
      value: definition.downvotes,
      inline: true,
    },
    {
      name: "Author",
      value: definition.contributor,
      inline: true,
    },
  ]);

  return embed;
}
async function getUrbanDictWord(word = "") {
  const request = await fetch(`https://www.urbandictionary.com/define.php?term=${word}`);

  switch (request.status) {
    case 404:
      return false;
      break;
  }

  const html = await request.text();

  const $ = load(html);

  const definitionElements = $(".definition");

  const definitions = [];
  const definitionIds = [];

  function siftDefinitionElements(definition, i) {
    const id = definition.attribs["data-defid"];

    const _$ = load(definition);

    const wordEl = _$(".word");
    const meaningEl = _$(".meaning");
    const exampleEl = _$(".example");
    const contributorEl = _$(".contributor a");

    definitionIds.push(id);

    definitions.push({
      id,
      word: wordEl.text().slice(0, 240),
      definition: meaningEl.find("br").replaceWith("\n").end().text().slice(0, 4096),
      example: exampleEl.find("br").replaceWith("\n").end().text().slice(0, 1024),
      contributor: contributorEl.text(),
      upvotes: null,
      downvotes: null,
    });
  }

  async function insertDefinitionData(ids = []) {
    const apiData = await fetch(`https://api.urbandictionary.com/v0/uncacheable?ids=${ids.join(",")}`);
    const definitionJson = await apiData.json();

    for (let i = 0; i < definitionJson.thumbs.length; i++) {
      const thumb = definitionJson.thumbs[i];

      const id = thumb.defid;

      const definition = definitions.find((def) => def.id === id.toString());

      const upvotes = thumb?.up ?? "??";
      const downvotes = thumb?.down ?? "??";
      definition.upvotes = upvotes.toString();
      definition.downvotes = downvotes.toString();
    }
  }

  for (let i = 0; i < definitionElements.length; i++) {
    siftDefinitionElements(definitionElements[i], i);
  }

  await insertDefinitionData(definitionIds);

  return definitions;
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
    if (args[1] === false) isUrban = false;

    let definitionPagesRaw;

    if (isUrban) {
      definitionPagesRaw = await getUrbanDictWord(word);
      if (definitionPagesRaw === false) return embedReply("No definition found", `Could not find urban definition of word "${word}"`);
    } else if (!isUrban && args[1] == null) {
      definitionPagesRaw = await getDictWord(word);
      if (definitionPagesRaw === false) definitionPagesRaw = await getUrbanDictWord(word);
      if (definitionPagesRaw === false) return embedReply("No definition found", `Could not find definitions of word "${word}"`);
      isUrban = true;
    } else if (!isUrban && args[1] === false) {
      definitionPagesRaw = await getDictWord(word);
      if (definitionPagesRaw === false) return embedReply("No definition found", `Could not find definition of word "${word}"`);
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
        if (activeDefinition.isUrban) return;
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

      if (activeDefinition.isUrban) {
        switch (i.customId) {
          case "prev": {
            if (activeDefinition.index === 0) return i.reply({ content: "Reached start of pages", ephemeral: true });

            --activeDefinition.index;
            checkButtons();
            await i.update({
              embeds: [createUrbanDictEmbed(activeDefinition, activeDefinition.definitions[activeDefinition.index])],
              components: [components],
            });
            break;
          }
          case "next": {
            if (activeDefinition.definitions.length === activeDefinition.index + 1) return i.reply({ content: "Reached end of pages", ephemeral: true });
            ++activeDefinition.index;
            checkButtons();
            await i.update({
              embeds: [createUrbanDictEmbed(activeDefinition, activeDefinition.definitions[activeDefinition.index])],
              components: [components],
            });
            break;
          }
        }
      } else {
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
      activeDefinitions.delete(message.id);
    });
  },
};
