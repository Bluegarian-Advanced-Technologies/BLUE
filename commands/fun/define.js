const { MessageEmbed, MessageActionRow, MessageButton, MessageComponentInteraction, Permissions } = require("discord.js");

const DefinitionStore = require("../../classes/DefinitionStore");

const store = new DefinitionStore();

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

    let definitionPagesRaw = isUrban ? await store.getUrbanDictWord(word) : await store.getDictWord(word);

    if (!isUrban && definitionPagesRaw === false) {
      definitionPagesRaw = await getUrbanDictWord(word);
      if (definitionPagesRaw === false) {
        return embedReply("No definition found", `Could not find definitions for word "${word}"`);
      }
    } else if (definitionPagesRaw === false) {
      return embedReply("No definition found", `Could not find definitions for word "${word}"`);
    }

    const identifier = channelId + new Date().getTime().toString();

    store.activeDefinitions.set(identifier, {
      isUrban,
      index: 0,
      innerIndex: isUrban ? null : 0,
      definitions: definitionPagesRaw,
    });

    const rawComponents = [
      new MessageButton().setCustomId("prev").setLabel("Previous").setStyle("PRIMARY"),
      new MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY"),
    ];
    if (!isUrban) {
      rawComponents.push(
        new MessageButton().setCustomId("prevdef").setLabel("-").setStyle("SECONDARY"),
        new MessageButton().setCustomId("nextdef").setLabel("+").setStyle("SECONDARY")
      );
    }

    const components = new MessageActionRow().addComponents(...rawComponents);

    const collector = store.getCollector(channel);
    collector.on("collect", async (i) => {
      if (i.user.id !== user.id && !member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
        return i.reply({ content: "Sorry, but this isn't your defintion panel.", ephemeral: true });

      const activeDefinition = store.activeDefinitions.get(identifier);

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
        // i: ButtonInteraction
        switch (i.customId) {
          case "prev": {
            if (activeDefinition.index === 0) return console.log("Start"); // TODO: Add beginning message

            --activeDefinition.index;
            await i.update({
              embeds: [store.createDictEmbed(activeDefinition.definitions[activeDefinition.index])],
            });
            break;
          }
          case "next": {
            if (activeDefinition.definitions.length === activeDefinition.index + 1) return console.log("End"); // TODO: Add end message

            ++activeDefinition.index;
            await i.update({
              embeds: [store.createDictEmbed(activeDefinition.definitions[activeDefinition.index])],
            });
            break; //ok  so I think what we should do
          }
          case "prevdef": {
            break;
          }
          case "nextdef": {
          }
        }
      }
    });

    collector.on("end", () => {
      for (let i = 0; i < activeChannelCollectors.length; i++) {
        if (activeChannelCollectors[i].id === identifier) {
          activeChannelCollectors.splice(i, 1);
          break;
        }
      }
    });

    const embedDefinition = isUrban ? store.createUrbanDictEmbed(definitionPagesRaw[0]) : store.createDictEmbed(definitionPagesRaw[0]);

    reply(null, false, {
      embeds: [embedDefinition],
      components: [components],
    });
  },
};
