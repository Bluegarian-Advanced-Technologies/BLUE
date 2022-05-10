const mongoose = require("mongoose");

const swearWord = mongoose.Schema({
  word: {
    type: String,
    maxLength: 256,
    required: true,
  },
  severity: {
    type: Number,
    default: 1,
    required: false,
  },
});

module.exports = mongoose.model("swearWord", swearWord);
