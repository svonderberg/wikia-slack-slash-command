A Slack slash command to retrieve either a random page or items from a particular page on a Wikia (subdomain of wikia.com) built in [Koa.js](https://github.com/koajs) with TypeScript and Babel (for ES6/7/async/await transpilation).

Options for Wikia to pull from are currently hardcoded (```OPTIONS_BY_WIKIA```) and include DOOM and Rick & Morty. A parser for the DOOM trivia page is included but if specifying another page another parser would likely have to be written.

The page parser uses the page scraping library [cheerio](https://github.com/cheeriojs/cheerio) to pull out individual DOOM trivia facts for delivery to the Slack channel.

Set up to be (and has previously been) deployed to Google's cloude NodeJS hosting (called the 'flexible' environment).