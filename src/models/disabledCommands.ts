import { DatabaseSchema } from "@nextium/common";

const disabledCommands = new DatabaseSchema("disabledCommands", {
  guildId: {
    type: String,
    required: true,
  },

  commands: {
    type: Array,
    default: [String],
    required: false,
  },
});

export default disabledCommands;
