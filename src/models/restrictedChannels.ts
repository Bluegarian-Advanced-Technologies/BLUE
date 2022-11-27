import { DatabaseSchema } from "@nextium/common";

const restrictedChannels = new DatabaseSchema("restrictedChannels", {
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

export default restrictedChannels;
