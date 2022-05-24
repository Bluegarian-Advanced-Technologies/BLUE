const mongoose = require("mongoose");

const restrictedChannel = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  channels: {
    type: Array,
    default: [],
    required: true,
  },
});

module.exports = mongoose.model("restrictedChannel", restrictedChannel);
