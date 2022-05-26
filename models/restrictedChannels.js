const mongoose = require("mongoose");

const restrictedChannel = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  commands: {
    type: Array,
    default: [],
    required: true,
  },
});

module.exports = mongoose.model("restrictedChannel", restrictedChannel);
