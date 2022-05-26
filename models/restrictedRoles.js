const mongoose = require("mongoose");

const restrictedRole = mongoose.Schema({
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

module.exports = mongoose.model("restrictedRole", restrictedRole);
