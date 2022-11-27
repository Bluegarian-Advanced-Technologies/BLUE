import { DatabaseSchema } from "@nextium/common";

const servers = new DatabaseSchema("servers", {
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
    required: false,
  },
});

export default servers
