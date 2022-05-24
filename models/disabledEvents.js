const mongoose = require("mongoose");

const disabledEvent = mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },

  events: {
    type: Array,
    default: [String],
    required: false,
  },
});

module.exports = mongoose.model("disabledEvent", disabledEvent);
