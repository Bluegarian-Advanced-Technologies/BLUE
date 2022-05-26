const { load } = require("cheerio");
const fetch = require("node-fetch");

async function getDictWord(word = "") {}

async function getUrbanDictWord(word = "") {
  const html = await (
    await fetch(`https://www.urbandictionary.com/define.php?term=${word}`)
  ).text();
  const $ = load(html);

  const definition = $("div.meaning")?.first().text();
  const author = $("div.contributor > a")?.first().text();
  const example = $("div.example")?.first().text();
  const id = $("div.definition")?.attr("data-defid");
  const data = await fetch(
    `https://api.urbandictionary.com/v0/uncacheable?ids=${id}`
  );
  const json = await data.json();
  const upvotes = json.thumbs[0]?.up ?? "";
  const downvotes = json.thumbs[0]?.down ?? "";

  const pages = [
    {
      author,
      definition,
      example,
      id,
      upvotes,
      downvotes,
    },
  ];

  return pages;
}

module.exports = {
  id: "define",
  description: "Recieve definitions of words",
  category: "Fun",
  aliases: ["def"],
  slash: "both",
  expectedArgs: [
    {
      type: "String",
      name: "word",
      description: "The word to be defined",
      required: true,
    },
    {
      type: "Boolean",
      name: "urban",
      description: "Force urban dictionary check of definition",
    },
  ],

  execute: async (cmd, { args, reply }) => {
    const word = args[0];
    const urbanOption = args[1];

    console.log(getUrbanDictWord(word)[0])

    reply("Check console")
  },
};
