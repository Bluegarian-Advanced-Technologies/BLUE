const { MessageEmbed } = require("discord.js");

let isCached = false;
let cachedHelpMenu;

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

  execute: (cmd, { client, config }) => {
    const { colors, assets } = config;

    if (isCached) {
      return cmd.reply({ embeds: [cachedHelpMenu] });
    }

    const helpEmbed = new MessageEmbed()
      .setColor(colors.primary)
      .setAuthor({ name: "BLUE Help Center", iconURL: assets.icon })
      .setDescription(`Command options wrapped in \`<>\` are **required**, while \`[]\` are **optional**. All commands have their (**/**) varients.\n`)
      .setTimestamp()
      .setFooter({ text: "Bluegarian Logistics Universal Emulator: BLUE" });

    client.commands.map((command) => {
      if (command.alias || command.hidden) return;

      // TODO: Add expected args

      helpEmbed.addField(`$ \`${command.id}\``, command.description);
    });

    if (!isCached) {
      isCached = true;
      cachedHelpMenu = helpEmbed;
    }

    cmd.reply({ embeds: [helpEmbed], allowedMentions: [] });
  },
};
