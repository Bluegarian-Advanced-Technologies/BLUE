const counters = [];

module.exports = {
  id: "count",
  description: "Count to a number",
  category: "Fun",
  slash: "both",
  aliases: [],
  expectedArgs: [
    {
      type: "Subcommand",
      name: "begin",
      description: "Starts counting",
      expectedArgs: [
        {
          type: "Integer",
          name: "start",
          description: "Starting number (exclusive)",
          required: true,
        },
        {
          type: "Integer",
          name: "end",
          description: "Ending number (inclusive)",
          required: true,
        },
      ],
    },
    {
      type: "Subcommand",
      name: "stop",
      description: "Stops counting",
      expectedArgs: [],
    },
  ],

  execute: (cmd, { channel, args, channelId, guildId, subcommand, reply, embedReply }) => {
    switch (subcommand) {
      case "begin": {
        if (counters?.find((counter) => counter.id === channelId + guildId)) return embedReply("Cannot start new counter while already counting", null, "warn");

        const num1 = args[0];
        const num2 = args[1];

        reply("Beginning count...");

        if (num1 === num2) {
          return channel.send(num1.toString());
        }

        let countSpeed = 1;
        if (num2 < num1) countSpeed = -1;

        let currentCount = num1;

        function stopCount(counter) {
          clearInterval(counter);
          counters.splice(
            counters.findIndex((countere) => countere.id === channelId + guildId),
            1
          );
          return;
        }

        const count = setInterval(
          () => {
            currentCount += countSpeed;

            channel.send(currentCount.toString()).catch(() => {
              stopCount(count);
            });

            if (currentCount === num2) {
              stopCount(count);
            }
          },
          Math.abs(num2 - num1) > 50 ? 1500 : 1000
        );

        counters.push({ id: channelId + guildId, counter: count, startNum: num1, stopNum: num2, difference: Math.abs(num2 - num1), stop: stopCount });
        break;
      }

      case "stop": {
        const counter = counters.find((counter) => counter.id === channelId + guildId);
        if (counter == null) return embedReply("Not currently counting in this channel", null, "warn");

        counter.stop(counter.counter);
        embedReply(
          "Stopped counting",
          counter.difference > 30 && counter.difference < 60 ? "(Backlogged numbers may keep coming in for a bit after due to the Discord API)" : null
        );
      }
    }
  },
};
