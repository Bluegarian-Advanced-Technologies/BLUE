module.exports = {
  id: "count",
  description: "Count to a number",
  category: "Fun",
  slash: "both",
  aliases: [],
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

  execute: (cmd, { channel, args, isInteraction }) => {
    const num1 = args[0];
    const num2 = args[1];

    if (isInteraction) cmd.reply({ content: "Beginning count..." });

    if (num1 === num2) {
      return channel.send(num1.toString());
    }

    let countSpeed = 1;
    if (num2 < num1) countSpeed = -1;

    let currentCount = num1;

    const count = setInterval(() => {
      currentCount += countSpeed;

      channel.send(currentCount.toString());

      if (Math.abs(currentCount) === Math.abs(num2)) return clearInterval(count);
    }, 1000);
  },
};
