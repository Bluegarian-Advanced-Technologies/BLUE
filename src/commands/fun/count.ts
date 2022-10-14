import { ApplicationCommandOptionType } from "discord.js";
import Command from "../../classes/Command";

interface Counter {
  id: string;
  counter: NodeJS.Timer;
  startNumber: number;
  endNumber: number;
  difference: number;
}

const counters: Counter[] = [];

export default new Command({
  id: "count",
  description: "Count to a number",
  category: "Fun",
  slash: "both",
  aliases: [],
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "begin",
      description: "Starts counting",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "start",
          description: "Starting number (exclusive)",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "end",
          description: "Ending number (inclusive)",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "stop",
      description: "Stops counting",
      options: [] 
    },
  ],
  permissions: []
}, async (client, context) => {
  const stopCount = (counter: NodeJS.Timer) => {
    clearInterval(counter);
    counters.splice(
      counters.findIndex((countere) => countere.id === context.channel.id + context.guild.id),
      1
    );
    return;
  };
  switch (context.subcommand) {
    case "begin": {
      if (counters?.find((counter) => counter.id === context.channel.id + context.guild.id)) 
        return context.embedReply("Cannot start new counter while already counting", undefined, "warn");

      const num1 = context.options[0] as number;
      const num2 = context.options[1] as number;

      await context.reply("Beginning count...");

      if (num1 === num2) {
        return await context.channel.send(num1.toString());
      }

      let countSpeed = 1;
      if (num2 < num1) countSpeed = -1;

      let currentCount = num1;

      const count = setInterval(
        () => {
          currentCount += countSpeed;

          context.channel.send(currentCount.toString());

          if (currentCount === num2) {
            stopCount(count);
          }
        },
        Math.abs(num2 - num1) > 50 ? 1500 : 1000
      );

      counters.push({ id: context.channel.id + context.guild.id, counter: count, startNumber: num1, endNumber: num2, difference: Math.abs(num2 - num1) });
      break;
    }

    case "stop": {
      const counter = counters.find((counter) => counter.id === context.channel.id + context.guild.id);
      if (counter == null) return context.embedReply("Not currently counting in this channel", undefined, "warn");

      stopCount(counter.counter);
      await context.embedReply(
        "Stopped counting",
        counter.difference > 30 && counter.difference < 60 ? "(Backlogged numbers may keep coming in for a bit after due to the Discord API)" : undefined
      );
    }
  }
});
