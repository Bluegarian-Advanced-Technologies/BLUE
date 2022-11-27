import chalk from "chalk";

import Client from "./classes/Client";
import { recursivelyGetFiles } from "./utilities.js";

const initialize = async (client: Client, commandsDir?: string) => {
  console.log(chalk.blue("Starting Bluegarian Advanced Command Handler..."));

  const commands = recursivelyGetFiles(commandsDir || "./dist/commands").filter((file) => file.endsWith(".js"));
  if (commands.find(c => c.endsWith("help.js")))
    commands.push(commands.splice(commands.findIndex(c => c.endsWith("help.js")), 1)[0]);

  console.log("Initializing live collections...");
  await client.bach.initialize();

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    await client.bach.registerCommand(command);
  }
}

export default { initialize };
