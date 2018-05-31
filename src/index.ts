import * as Koa from 'koa';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

const cheerio = require('cheerio');
const koaBody = require('koa-body');
const toMarkdown = require('to-markdown');

interface WikiaOptions {
  [id: string]: {
    icon: string;
    name: string;
    page?: string;
    category?: string;
  }
}

interface WikiaItemListing {
  id: string;
}

interface WikiaItem {
  url: string;
  title: string;
  abstract: string;
  thumbnail: string;
}

interface SlackMessage {
  response_type: string;
  attachments?: Array<SlackMessageAttachment>;
}

interface SlackMessageAttachment {
  title?: string;
  title_link?: string;
  text: string;
  thumb_url?: string;
  mrkdwn_in?: Array<any>
}

const OPTIONS_BY_WIKIA = {
  doom: {
    icon: 'https://emoji.slack-edge.com/T0HLB7B4L/godmode/1bd6476fbb.png',
    name: 'DOOM Guy says...',
    page: '/wiki/Trivia'
  },
  rickandmorty: {
    icon: 'https://i.imgur.com/XsuoAYY.png',
    name: 'Remember this one broh...'
  }
};

async function doSlackPost(requestedWikia: string, request: AxiosRequestConfig, options: WikiaOptions) {
  // Build Wikia API request URL from requested path.
  const wikiaRootURL: string = `http://${requestedWikia}.wikia.com`;
  const wikiaAPI: string = `${wikiaRootURL}/api/v1/Articles/`;
  let wikiaItemsURL: string = `${wikiaAPI}List?limit=9999999999`;
  
  if (options.category) wikiaItemsURL = `${wikiaItemsURL}&category=${options.category}`;
  if (options.page) wikiaItemsURL = `${wikiaRootURL}${options.page}`;
  
  const response: AxiosResponse = await axios.get(wikiaItemsURL);
  
  const slackMessage: SlackMessage = {
    response_type: 'in_channel'
  };
  let attachments:Array<SlackMessageAttachment>;
  
  const randRange = (min, max) => Math.floor(Math.random() * max) + min;
  
  if (options.page) {
    const $ = cheerio.load(response.data);
    const items = $('.mw-content-text p');
    const item = items.eq(randRange(0, items.length - 1)).html();

    const converters = [
      {
        filter: 'b',
        replacement: (bContent: string) => `*${bContent}*`
      },
      {
        filter: 'a',
        replacement: (aContent: string, aNode: Node) => {
          const rawURL = aNode.attributes['href'].value;
          const url = rawURL.indexOf('http') === 0 ? rawURL : `${wikiaRootURL}${rawURL}`;

          return `<${url}|${aContent}>`;
        }
      }
    ];

    attachments = [{
      text: toMarkdown(item, { converters }),
      mrkdwn_in: ['text']
    }];
  } else {
    // Extract article (called 'item' in Wikia API) listings from response.
    const { data: { items: itemListings } }: {data: { items: Array<WikiaItemListing> }} = response;
  
    // Choose a random article ID from the returned list of articles.
    // const randomIdx = Math.floor(Math.random() * (itemListings.length - 1)) + 1;
    const randomIdx = randRange(itemListings.length - 1, 1);
    const articleId = itemListings[randomIdx].id;
  
    // Request the full article from the Wikia API.
    const { data: { items } }: {data: { items: Array<WikiaItem> }} =
      await axios.get(`${wikiaAPI}Details?ids=${articleId}`);
  
    const { url, title, abstract: text, thumbnail: thumb_url } = items[articleId];
    const title_link = `${wikiaRootURL}${url}`;
  
    attachments = [{
      title,
      title_link: `${wikiaRootURL}${url}`,
      text,
      thumb_url
    }];
  }
  slackMessage.attachments = attachments;
  
  console.log(slackMessage);
  axios.post(request.body.response_url, slackMessage);
}

const app = new Koa();

app.use(koaBody());

app.use(async (ctx: Koa.Context) => {
  const requestedWikia: string = ctx.request.path.slice(1);
  
  // No Wikia subdomain was specified so throw error.
  if (requestedWikia === '') {
    ctx.status = 404;
    ctx.body = 'No Wikia subdomain was specified.';    
    return;
  }

  const options = OPTIONS_BY_WIKIA[requestedWikia] ||
    { icon: null, name: `Getting a ${requestedWikia} fact...` };

  const { icon: author_icon, name: author_name } = options;

  ctx.body = {
    response_type: 'in_channel',
    attachments: [
      {
        author_icon,
        author_name
      }
    ]
  };

  doSlackPost(requestedWikia, ctx.request, options);
});

app.listen(process.env.PORT || 8080);