const { EmbedBuilder, formatEmoji } = require("discord.js");

module.exports = {
  id: "help",
  description: "Display BLUE's help menu",
  category: "Help",
  aliases: ["?"],
  slash: "both",
  expectedArgs: [
    {
      type: "String",
      name: "category",
      description: "View commands of specified module category",
    },
  ],

  execute: (cmd, { client, reply, config }) => {
    const { colors, assets } = config;
    const commandCategories = [];

    const helpEmbed = new EmbedBuilder()
      .setColor(colors.primary)
      .setAuthor({ name: "BLUE Help Center", iconURL: assets.icon, url: null })
      .setDescription(`Command options wrapped in \`<>\` are **required**, whilst \`[]\` are **optional**. All commands have their (**/**) varients.\n`)
      .setTimestamp()
      .setFooter({ text: "Bluegarian Logistics Universal Emulator: BLUE" });

    client.BACH.commands.map((command) => {
      if (command.alias || command.hidden) return;

      if (commandCategories.length === 0) {
        commandCategories.push({
          category: command.category,
          commands: [
            {
              id: command.id,
              description: command.description,
            },
          ],
        });
      } else {
        for (let i = 0; i < commandCategories.length; i++) {
          const category = commandCategories[i];

          if (category.category === command.category) {
            category.commands.push({
              id: command.id,
              description: command.description,
            });

            return;
          }
        }

        commandCategories.push({
          category: command.category,
          commands: [
            {
              id: command.id,
              description: command.description,
            },
          ],
        });
      }

      // TODO: Add expected args
    });

    for (let i = 0; i < commandCategories.length; ++i) {
      const category = commandCategories[i];
      const fields = [];

      for (let o = 0; o < category.commands.length; o++) {
        const command = category.commands[o];
        fields.push({ name: `$ \`${command.id}\``, value: command.description });
      }

      helpEmbed.addFields(fields);
    }

    reply(null, false, { embeds: [helpEmbed] });
  },
};
