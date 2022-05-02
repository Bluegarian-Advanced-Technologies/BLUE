const { SlashCommandBuilder } = require("@discordjs/builders");
const utils = require("../utils.js");

const registerCommand = (client, cmd) => {
  const command = require(cmd);

  if (command.notCommand) return false;

  const { id, description, aliases, slash, expectedArgs } = command;

  if (slash === "both" || slash === true) {
    command.data = new SlashCommandBuilder().setName(id).setDescription(description);

    for (let i = 0; i < expectedArgs.length; i++) {
      try {
        const arg = expectedArgs[i];
        const { type, name, required, description, options } = arg;

        let dynamicOption = `add${type.charAt(0).toUpperCase() + type.toLowerCase().slice(1)}Option`;
        expectedArgs[i].type = type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);

        command.data[dynamicOption]((option) => {
          option
            .setName(name.toLowerCase())
            .setDescription(description)
            .setRequired(required || false);

          if (options) option.setChoices(...options);

          return option;
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  command.expectedArgs = expectedArgs;

  for (let i = 0; i < aliases.length; i++) {
    const alias = aliases[i];

    client.commands.set(alias, {
      alias: true,
      cmdName: id,
    });
  }

  client.commands.set(id, command);

  console.log(`Module '${id}' of ${command?.category ? command.category : ""} ready`);

  if (command.init) command.init({ client });

  return command;
};

module.exports = { register: registerCommand };
