const { EmbedBuilder } = require("discord.js");

function createArgString(args) {
  try {
    let argConstruct = "";

    args.forEach((arg) => {
      if (arg.required) {
        argConstruct += ` <${arg.name}>`;
      } else {
        argConstruct += ` [${arg.name}]`;
      }
    });

    return argConstruct;
  } catch (err) {
    console.error(err);

    return false;
  }
}

const commandCategories = [];

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
      options: [], // Dynamically generated, help command is forced to be last command to be registered
    },
  ],

  execute: (cmd, { client, args, reply, config }) => {
    const { colors, assets } = config;

    const helpEmbed = new EmbedBuilder()
      .setColor(colors.primary)
      .setAuthor({ name: "BLUE Help Center", iconURL: assets.icon, url: null })
      .setDescription(`Command options wrapped in \`<>\` are **required**, whilst \`[]\` are **optional**. All commands have their (**/**) varients.\n`)
      .setTimestamp()
      .setFooter({ text: "Bluegarian Logistics Universal Emulator: BLUE", iconURL: config.assets.icon });

    const helpCategory = args[0];

    if (commandCategories.length === 0) {
      client.BACH.commands.forEach((command) => {
        if (command.alias || command.hidden) return;

        if (commandCategories.length === 0) {
          // Push to new category as categories are empty
          const commandsList = [];

          if (command.subcommanded) {
            command.expectedArgs.forEach((arg) => {
              commandsList.push({
                id: `${command.id} ${arg.name}`,
                description: arg.description,
                arguements: createArgString(arg.expectedArgs),
              });
            });
          } else {
            commandsList.push({
              id: command.id,
              description: command.description,
              arguements: createArgString(command.expectedArgs),
            });
          }

          commandCategories.push({
            category: command.category,
            commands: commandsList,
          });
        } else {
          const commandsList = [];

          for (let i = 0; i < commandCategories.length; i++) {
            const category = commandCategories[i];

            if (category.category === command.category) {
              // Push to existing category
              if (command.subcommanded) {
                command.expectedArgs.forEach((arg) => {
                  category.commands.push({
                    id: `${command.id} ${arg.name}`,
                    description: arg.description,
                    arguements: createArgString(arg.expectedArgs),
                  });
                });
              } else {
                category.commands.push({
                  id: command.id,
                  description: command.description,
                  arguements: createArgString(command.expectedArgs),
                });
              }
              return;
            }
          }

          // Push to new category since not yet made
          if (command.subcommanded) {
            command.expectedArgs.forEach((arg) => {
              commandsList.push({
                id: `${command.id} ${arg.name}`,
                description: arg.description,
                arguements: createArgString(arg.expectedArgs),
              });
            });
          } else {
            commandsList.push({
              id: command.id,
              description: command.description,
              arguements: createArgString(command.expectedArgs),
            });
          }

          commandCategories.push({
            category: command.category,
            commands: commandsList,
          });
        }
      });
    }

    if (helpCategory != null) {
      const category = commandCategories.find((cat) => cat.category === helpCategory);

      helpEmbed.setTitle(`Commands of ${category.category}`);

      const fields = [];

      for (let i = 0; i < category.commands.length; i++) {
        const command = category.commands[i];

        fields.push({
          name: `${config.prefix}\`${command.id}${command.arguements}\``,
          value: command.description,
        });
      }

      helpEmbed.addFields(fields);
    } else {
      for (let i = 0; i < commandCategories.length; ++i) {
        const category = commandCategories[i];
        const fields = [];

        for (let o = 0; o < category.commands.length; o++) {
          const command = category.commands[o];
          fields.push({ name: `${config.prefix}\`${command.id}${command.arguements}\``, value: command.description });
        }

        helpEmbed.addFields(fields);
      }
    }

    reply(null, false, { embeds: [helpEmbed] });
  },
};
