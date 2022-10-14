import { DatabaseSchema } from "@nextium/common";

const swearWords = new DatabaseSchema("swearWords", {
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

export default swearWords;
