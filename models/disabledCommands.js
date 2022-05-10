const mongoose = require("mongoose");

const disabledCommand = mongoose.Schema({
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

module.exports = mongoose.model("disabledCommand", disabledCommand);
