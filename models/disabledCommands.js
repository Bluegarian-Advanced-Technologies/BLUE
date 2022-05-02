const { DatabaseSchema } = require("@nextium/common");

const disabledCommand = new DatabaseSchema("disabledCommand", {
  guildId: {
    type: String,
    required: true,
  },

  commands: {
    type: Array,
    default: [],
    required: false,
  },
});

module.exports = disabledCommand;
