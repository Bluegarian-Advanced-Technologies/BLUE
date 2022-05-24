const mongoose = require("mongoose");

const disabledCommand = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  commands: {
    type: Array,
    default: [String],
    required: false,
  },
});

module.exports = mongoose.model("disabledCommand", disabledCommand);
