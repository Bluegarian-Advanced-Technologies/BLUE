const mongoose = require("mongoose");

const restrictedRole = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  roles: {
    type: Array,
    default: [],
    required: true,
  },
});

module.exports = mongoose.model("restrictedRole", restrictedRole);
