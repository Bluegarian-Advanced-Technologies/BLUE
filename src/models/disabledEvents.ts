import { DatabaseSchema } from "@nextium/common";

const disabledEvents = new DatabaseSchema("disabledEvents", {
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

export default disabledEvents;
