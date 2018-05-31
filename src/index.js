"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var Koa = require("koa");
var axios_1 = require("axios");
var cheerio = require('cheerio');
var koaBody = require('koa-body');
var toMarkdown = require('to-markdown');
var OPTIONS_BY_WIKIA = {
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
function doSlackPost(requestedWikia, request, options) {
    return __awaiter(this, void 0, void 0, function () {
        var wikiaRootURL, wikiaAPI, wikiaItemsURL, response, slackMessage, attachments, randRange, $, items, item, converters, itemListings, randomIdx, articleId, items, _a, url, title, text, thumb_url, title_link;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    wikiaRootURL = "http://" + requestedWikia + ".wikia.com";
                    wikiaAPI = wikiaRootURL + "/api/v1/Articles/";
                    wikiaItemsURL = wikiaAPI + "List?limit=9999999999";
                    if (options.category)
                        wikiaItemsURL = wikiaItemsURL + "&category=" + options.category;
                    if (options.page)
                        wikiaItemsURL = "" + wikiaRootURL + options.page;
                    return [4 /*yield*/, axios_1["default"].get(wikiaItemsURL)];
                case 1:
                    response = _b.sent();
                    slackMessage = {
                        response_type: 'in_channel'
                    };
                    randRange = function (min, max) { return Math.floor(Math.random() * max) + min; };
                    if (!options.page) return [3 /*break*/, 2];
                    $ = cheerio.load(response.data);
                    items = $('.mw-content-text p');
                    item = items.eq(randRange(0, items.length - 1)).html();
                    converters = [
                        {
                            filter: 'b',
                            replacement: function (bContent) { return "*" + bContent + "*"; }
                        },
                        {
                            filter: 'a',
                            replacement: function (aContent, aNode) {
                                var rawURL = aNode.attributes['href'].value;
                                var url = rawURL.indexOf('http') === 0 ? rawURL : "" + wikiaRootURL + rawURL;
                                return "<" + url + "|" + aContent + ">";
                            }
                        }
                    ];
                    attachments = [{
                            text: toMarkdown(item, { converters: converters }),
                            mrkdwn_in: ['text']
                        }];
                    return [3 /*break*/, 4];
                case 2:
                    itemListings = response.data.items;
                    randomIdx = randRange(itemListings.length - 1, 1);
                    articleId = itemListings[randomIdx].id;
                    return [4 /*yield*/, axios_1["default"].get(wikiaAPI + "Details?ids=" + articleId)];
                case 3:
                    items = (_b.sent()).data.items;
                    _a = items[articleId], url = _a.url, title = _a.title, text = _a.abstract, thumb_url = _a.thumbnail;
                    title_link = "" + wikiaRootURL + url;
                    attachments = [{
                            title: title,
                            title_link: "" + wikiaRootURL + url,
                            text: text,
                            thumb_url: thumb_url
                        }];
                    _b.label = 4;
                case 4:
                    slackMessage.attachments = attachments;
                    console.log(slackMessage);
                    axios_1["default"].post(request.body.response_url, slackMessage);
                    return [2 /*return*/];
            }
        });
    });
}
var app = new Koa();
app.use(koaBody());
app.use(function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var requestedWikia, options, author_icon, author_name;
    return __generator(this, function (_a) {
        requestedWikia = ctx.request.path.slice(1);
        // No Wikia subdomain was specified so throw error.
        if (requestedWikia === '') {
            ctx.status = 404;
            ctx.body = 'No Wikia subdomain was specified.';
            return [2 /*return*/];
        }
        options = OPTIONS_BY_WIKIA[requestedWikia] ||
            { icon: null, name: "Getting a " + requestedWikia + " fact..." };
        author_icon = options.icon, author_name = options.name;
        ctx.body = {
            response_type: 'in_channel',
            attachments: [
                {
                    author_icon: author_icon,
                    author_name: author_name
                }
            ]
        };
        doSlackPost(requestedWikia, ctx.request, options);
        return [2 /*return*/];
    });
}); });
app.listen(process.env.PORT || 8080);
