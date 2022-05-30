const mongoose = require("mongoose");

const server = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  whitelisted: {
    type: Boolean,
  },
});

module.exports = mongoose.model("server", server);
