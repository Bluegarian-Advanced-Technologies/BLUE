import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionsBitField, ColorResolvable, ApplicationCommandOptionType, ButtonStyle } from "discord.js";
import { load, Element } from "cheerio";
import fetch from "node-fetch";
import settings from "../../settings.json" assert { type: "json" };
import Command from "../../classes/Command";

interface ActiveDefinition {
  isUrban: boolean,
  index: number,
  innerIndex?: number,
  definitions: Definition[] | UrbanDefinition[]
}

interface Definition {
  word: string,
  definitions: string[],
  partOfSpeech: string,
  synonyms: string[],
  antonyms: string[],
  textPhonetic: string,
}

interface UrbanDefinition {
  id: string,
  word: string,
  definition: string,
  example: string,
  contributor: string,

  upvotes?: number,
  downvotes?: number,
}

const activeDefinitions = new Map<string, ActiveDefinition>();

function createDictEmbed(raw: ActiveDefinition, definition: Definition, innerIndex = 0) {
  const embed = new EmbedBuilder()
    .setTitle(`Definition of "${definition.word}"`)
    .setColor(settings.colors.primary as ColorResolvable)
    .setDescription(definition.definitions[innerIndex])
    .setFooter({
      text: `Page ${(raw.index ?? 0) + 1}/${raw.definitions.length} | Def. ${innerIndex + 1}/${definition.definitions?.length}`,
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

const getDictWord = async (word: string): Promise<Definition[] | undefined> => {
  const result = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word);

  if (!result.ok) return;

  const rawDefs = await result.json() as {
    meanings: {
      partOfSpeech: string,
      definitions: {
        definition: string,
      }[],
      synonyms: string[],
      antonyms: string[],
    }[],
    phonetic: string,
    word: string,
  }[];

  const definition = rawDefs[0];

  const pages = definition.meanings.map((meaning) => {
    const defs = meaning.definitions.map(def => def.definition);

    return {
      word: definition.word,
      partOfSpeech: meaning?.partOfSpeech,
      definitions: defs,
      synonyms: meaning?.synonyms ?? [],
      antonyms: meaning?.antonyms ?? [],
      textPhonetic: definition?.phonetic,
    };
  });

  return pages;
}

const createUrbanDictEmbed = (raw: ActiveDefinition, definition: UrbanDefinition) => {
  const embed = new EmbedBuilder()
    .setTitle(`Definition of "${definition.word}"`)
    .setDescription(definition.definition)
    .setColor(settings.colors.primary as ColorResolvable)
    .setFooter({
      text: `Page ${raw.index + 1}/${raw.definitions.length}`,
    });

  embed.addFields([
    {
      name: "Example",
      value: definition.example,
    },
    {
      name: "Upvotes",
      value: definition.upvotes?.toString() ?? "0",
      inline: true,
    },
    {
      name: "Downvotes",
      value: definition.downvotes?.toString() ?? "0",
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

const getUrbanDictWord = async (word: string): Promise<UrbanDefinition[] | undefined> => {
  const request = await fetch(`https://www.urbandictionary.com/define.php?term=${word}`);

  if (!request.ok) return;

  const html = await request.text();

  const $ = load(html);

  const definitionElements = $(".definition");

  const definitions: UrbanDefinition[] = [];

  const siftDefinitionElements = (definition: Element): UrbanDefinition => {
    const id = definition.attribs["data-defid"];

    const _$ = load(definition);

    const wordEl = _$(".word");
    const meaningEl = _$(".meaning");
    const exampleEl = _$(".example");
    const contributorEl = _$(".contributor a");

    const word = wordEl.text().slice(0, 240);
    const definitionText = meaningEl.find("br").replaceWith("\n").end().text().slice(0, 4096);
    const example = exampleEl.find("br").replaceWith("\n").end().text().slice(0, 1024);
    const contributor = contributorEl.text();

    return {
      id,
      word,
      definition: definitionText,
      example: example ?? "None",
      contributor: contributor ?? "Unknown",
    };
  }

  for (let i = 0; i < definitionElements.length; i++) {
    definitions.push(siftDefinitionElements(definitionElements[i]));
  }

  const apiData = await fetch(`https://api.urbandictionary.com/v0/uncacheable?ids=${definitions.map(d => d.id).join(",")}`);

  if (!apiData.ok) return;

  const definitionJson = await apiData.json() as {
    thumbs: {
      up: number,
      down: number,
      defid: string,
    }[]
  };

  for (let i = 0; i < definitionJson.thumbs.length; i++) {
    const thumb = definitionJson.thumbs[i];

    const id = thumb.defid;

    const definition = definitions.find((def) => def.id === id.toString());

    if (definition) {
      definition.upvotes = thumb?.up;
      definition.downvotes = thumb?.down;
    }
  }

  return definitions;
};

export default new Command({
  id: "define",
  description: "Recieve definitions of words",
  category: "Fun",
  aliases: ["def"],
  slash: "both",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "word",
      description: "The word to be defined",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "urban",
      description: "Force urban dictionary check of definition",
    },
  ],
  permissions: [],
}, async (client, context) => {
  const word = (context.options[0] as string).toLowerCase();
  let isUrban = context.options[1] as boolean | undefined;

  let definitionPagesRaw: Definition[] | UrbanDefinition[] | undefined;

  if (isUrban) {
    definitionPagesRaw = await getUrbanDictWord(word);
    if (!definitionPagesRaw) return context.embedReply("No definition found", `Could not find urban definition of word "${word}"`);
  } else if (isUrban === undefined) {
    definitionPagesRaw = await getDictWord(word);
    if (definitionPagesRaw) {
      isUrban = false;
    } else {
      definitionPagesRaw = await getUrbanDictWord(word);
      isUrban = true;
    }
    if (!definitionPagesRaw) return context.embedReply("No definition found", `Could not find definitions of word "${word}"`);
  } else if (isUrban === false) {
    definitionPagesRaw = await getDictWord(word);
    if (!definitionPagesRaw) return context.embedReply("No definition found", `Could not find definition of word "${word}"`);
  }

  const rawComponents = [
    new ButtonBuilder().setCustomId("prev").setLabel("Previous").setStyle(ButtonStyle.Primary).setDisabled(true),
    new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Primary),
  ];
  if (!isUrban) {
    rawComponents.push(
      new ButtonBuilder().setCustomId("prevdef").setLabel("-").setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId("nextdef").setLabel("+").setStyle(ButtonStyle.Secondary),
    );
  }

  if (definitionPagesRaw?.length! < 2) rawComponents[1].setDisabled(true);
  if ((definitionPagesRaw?.[0] as Definition).definitions) {
    if ((definitionPagesRaw?.[0] as Definition).definitions.length < 2) rawComponents[3].setDisabled(true);
  }

  const components = new ActionRowBuilder().setComponents(rawComponents);

  const activeDefinition: ActiveDefinition = {
    isUrban,
    definitions: definitionPagesRaw as Definition[] | UrbanDefinition[],
    index: 0,
    innerIndex: isUrban ? undefined : 0,
  };
  const embedDefinition = isUrban
    ? createUrbanDictEmbed(activeDefinition, definitionPagesRaw![0] as UrbanDefinition)
    : createDictEmbed(activeDefinition, definitionPagesRaw![0] as Definition);

  const message = await context.reply({
    embeds: [embedDefinition],
    // @ts-expect-error Components are typed weirdly
    components: [components],
  });

  activeDefinitions.set(message.id, activeDefinition);

  const collector = message.createMessageComponentCollector({ idle: 100000 });
  collector.on("collect", async (i) => {
    if (i.user.id !== context.user.id && !context.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await i.reply({ content: "Sorry, but this isn't your definition panel.", ephemeral: true });
      return;
    }

    const activeDefinition = activeDefinitions.get(message.id);

    if (!activeDefinition) {
      await i.reply({ content: "Sorry, but this definition panel has expired.", ephemeral: true });
      collector.stop();
      return;
    }

    const checkButtons = () => {
      if (activeDefinition.definitions.length === activeDefinition.index + 1) {
        (components.components[1] as ButtonBuilder).setDisabled(true);
      } else {
        (components.components[1] as ButtonBuilder).setDisabled(false);
      }
      if (activeDefinition.index === 0) {
        (components.components[0] as ButtonBuilder).setDisabled(true);
      } else {
        (components.components[0] as ButtonBuilder).setDisabled(false);
      }
      if (activeDefinition.isUrban) return;
      const definition = activeDefinition.definitions[activeDefinition.index] as Definition;
      if (definition.definitions.length === activeDefinition.innerIndex! + 1) {
        (components.components[3] as ButtonBuilder).setDisabled(true);
      } else {
        (components.components[3] as ButtonBuilder).setDisabled(false);
      }
      if (activeDefinition.innerIndex === 0) {
        (components.components[2] as ButtonBuilder).setDisabled(true);
      } else {
        (components.components[2] as ButtonBuilder).setDisabled(false);
      }
    }

    if (activeDefinition.isUrban) {
      switch (i.customId) {
        case "prev": {
          if (activeDefinition.index === 0) {
            await i.reply({ content: "Reached start of pages", ephemeral: true });
            return;
          }

          --activeDefinition.index;
          checkButtons();
          const definition = activeDefinition.definitions[activeDefinition.index] as UrbanDefinition;
          await i.update({
            embeds: [createUrbanDictEmbed(activeDefinition, definition)],
            // @ts-expect-error Components are typed weirdly
            components: [components],
          });
          break;
        }
        case "next": {
          if (activeDefinition.definitions.length === activeDefinition.index + 1) {
            await i.reply({ content: "Reached end of pages", ephemeral: true });
            return;
          }
          ++activeDefinition.index;
          checkButtons();
          const definition = activeDefinition.definitions[activeDefinition.index] as UrbanDefinition;
          await i.update({
            embeds: [createUrbanDictEmbed(activeDefinition, definition)],
            // @ts-expect-error Components are typed weirdly
            components: [components],
          });
          break;
        }
      }
    } else {
      switch (i.customId) {
        case "prev": {
          if (activeDefinition.index === 0){
            await i.reply({ content: "Reached start of pages", ephemeral: true });
            return;
          } 
          activeDefinition.innerIndex = 0;

          --activeDefinition.index;
          checkButtons();
          const definition = activeDefinition.definitions[activeDefinition.index] as Definition;
          await i.update({
            embeds: [createDictEmbed(activeDefinition, definition, activeDefinition.innerIndex)],
            // @ts-expect-error Components are typed weirdly
            components: [components],
          });
          break;
        }
        case "next": {
          if (activeDefinition.definitions.length === activeDefinition.index + 1) {
            await i.reply({ content: "Reached end of pages", ephemeral: true });
            return;
          }
          activeDefinition.innerIndex = 0;

          ++activeDefinition.index;
          checkButtons();
          const definition = activeDefinition.definitions[activeDefinition.index] as Definition;
          await i.update({
            embeds: [createDictEmbed(activeDefinition, definition, activeDefinition.innerIndex)],
            // @ts-expect-error Components are typed weirdly
            components: [components],
          });
          break;
        }
        case "prevdef": {
          if (activeDefinition.innerIndex === 0) {
            await i.reply({ content: "Reached start of definitions", ephemeral: true });
            return;
          }

          --activeDefinition.innerIndex!;
          checkButtons();
          const definition = activeDefinition.definitions[activeDefinition.index] as Definition;
          await i.update({
            embeds: [createDictEmbed(activeDefinition, definition, activeDefinition.innerIndex)],
            // @ts-expect-error Components are typed weirdly
            components: [components],
          });

          break;
        }
        case "nextdef": {
          const definition = activeDefinition.definitions[activeDefinition.index] as Definition;
          if (definition.definitions.length === activeDefinition.innerIndex! + 1) {
            await i.reply({ content: "Reached end of definitions", ephemeral: true });
            return;
          }

          ++activeDefinition.innerIndex!;
          checkButtons();
          await i.update({
            embeds: [createDictEmbed(activeDefinition, definition, activeDefinition.innerIndex)],
            // @ts-expect-error Components are typed weirdly
            components: [components],
          });
        }
      }
    }
  });

  collector.on("end", () => {
    message
      .edit({
        components: [],
      })
      .catch(() => {});

    activeDefinitions.delete(message.id);
  });
});
