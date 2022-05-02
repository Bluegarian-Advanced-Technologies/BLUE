module.exports = {
  id: "command",
  description: "Enable or disable commands",
  category: "Command Handler",
  slash: "both",
  aliases: [],
  expectedArgs: [
    {
      type: "String",
      name: "action",
      description: "Enable or disable command",
      options: [
        {
          name: "Enable",
          value: "on",
        },
        {
          name: "Disable",
          value: "off",
        },
      ],
      required: true,
    },
    {
      type: "String",
      name: "command",
      description: "Targetted command",
      required: true,
    },
  ],

  execute: (cmd, { client, args }) => {
    switch (args[0]) {
    }

    cmd.reply({
      content: "Check console",
    });
  },
};
