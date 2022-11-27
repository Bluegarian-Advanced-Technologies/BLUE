import { DatabaseSchema } from "@nextium/common";

const users = new DatabaseSchema("users", {
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

  preferences: {
    type: Object,
    default: {},
    required: false,
  },

  saved: {
    type: Object,
    default: {},
    required: false,
  },
});

export default users;
