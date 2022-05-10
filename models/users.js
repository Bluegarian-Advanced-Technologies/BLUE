const mongoose = require("mongoose");

const user = mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  elevation: {
    type: Number,
    default: 1,
    min: 0,
    max: 5,
    required: false,
  },
});

module.exports = mongoose.model("user", user);
