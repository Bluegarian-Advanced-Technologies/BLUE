const { DatabaseSchema } = require("@nextium/common");

const swearWord = new DatabaseSchema("swearWord", {
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

module.exports = swearWord;
