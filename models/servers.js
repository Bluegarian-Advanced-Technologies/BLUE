const mongoose = require("mongoose");

const server = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  whitelisted: {
    type: Boolean,
    default: false,
  },

  preferences: {
    type: Object,
    default: {},
  },
});

module.exports = mongoose.model("server", server);
