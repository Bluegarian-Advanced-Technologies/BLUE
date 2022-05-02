module.exports = {
  id: "test",
  description: "This is a test command",
  category: "Emperor",
  aliases: [],
  slash: "both",
  expectedArgs: [
    {
      type: "User",
      name: "testser",
      description: "test test user",
      required: true,
    },
    {
      type: "Number",
      name: "testumber",
      description: "test test number",
      required: true,
    },
  ],

  execute: (cmd, { client, config }) => {
    cmd.reply({ content: "E" });
  },
};
