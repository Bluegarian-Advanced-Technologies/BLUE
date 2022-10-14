import { DatabaseSchema } from "@nextium/common";

const restrictedRoles = new DatabaseSchema("restrictedRoles", {
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

export default restrictedRoles;
