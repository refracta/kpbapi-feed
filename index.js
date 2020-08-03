process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
// WARNING: https://stackoverflow.com/questions/31673587/error-unable-to-verify-the-first-certificate-in-nodejs

const kpbapi = require('./koreatech-api/koreatech-portal-board');

const argv = process.argv.slice(2);

const LIGHT_MODE = (process.env.LIGHT_MODE || argv[0]) == 'true' ? true : false;
const ID = process.env.KOREATECH_ID || argv[1];
const PW = process.env.KOREATECH_PW || argv[2];
const READY_TO_LOGIN = ID && PW;

const LIST_ACCESSIBLE_BOARD = Object.values(kpbapi.BOARD_ID_MAP).filter(e => READY_TO_LOGIN ? true : kpbapi.BOARD_PRIVILEGE_MAP_REVERSE[e] <= 1);
const POST_ACCESSIBLE_BOARD = Object.values(kpbapi.BOARD_ID_MAP).filter(e => READY_TO_LOGIN ? true : kpbapi.BOARD_PRIVILEGE_MAP_REVERSE[e] <= 0);

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const Feed = require('feed').Feed;

const express = require('express');
const app = express();
const http = require('http');
const port = process.env.PORT || 6060;
const httpServer = http.createServer(app);

var initDB = {};
Object.values(kpbapi.BOARD_ID_MAP).forEach(e => {
  initDB[e] = {};
});
db.defaults(initDB).write();

Date.prototype.timezoneOffset = new Date().getTimezoneOffset();
Date.setTimezoneOffset = function(timezoneOffset) {
  return this.prototype.timezoneOffset = timezoneOffset;
};
const UPDATE_TIME = 1000 * 60 * 60 * 1;
var cachedDB;
var lastUpdated;

async function updatePostInfo(forceUpdate = false) {
  await Promise.all(POST_ACCESSIBLE_BOARD.map(async e => {
    var targetDB = db.get(e);
    await Promise.all(Object.values(targetDB.value()).map(async p => {
      var isExistPostInfo = p.info;
      if (!isExistPostInfo || forceUpdate) {
        console.log('getPostInfo:', p.title);
        targetDB.get(p.post_seq).assign({
          info: await kpbapi.getPostInfo(p.url),
          updated: new Date()
        }).write();
      }
    }));
  }));
}

async function updatePostList() {
  await Promise.all(LIST_ACCESSIBLE_BOARD.map(async e => {
    var targetDB = db.get(e);
    var boardURL = kpbapi.getPortalBoardURL(e);
    console.log('getPostList:', kpbapi.BOARD_ID_MAP_REVERSE[e]);
    var postList = await kpbapi.getPostList(boardURL);
    var updated = new Date();
    postList.forEach(p => {
      var isExistPost = targetDB.get(p.post_seq).value();
      if (!isExistPost) {
        p.updated = updated;
        targetDB.assign({
          [p.post_seq]: p
        }).write();
      }
    });

    var oldPostList = Object.keys(targetDB.value()).sort();
    oldPostList = oldPostList.splice(0, oldPostList.length - postList.length);
    oldPostList.forEach(pid => {
      targetDB.unset(pid).write();
    });
  }));
}

async function update() {
  console.log('update');
  if (READY_TO_LOGIN) {
    console.log('login');
    await kpbapi.login(ID, PW);
  }
  console.log('updatePostList');
  await updatePostList();
  if (!LIGHT_MODE) {
    console.log('updatePostInfo');
    await updatePostInfo();
  }
  cachedDB = db.value();
  lastUpdated = new Date();
}


function generateFeed(boardIdList = LIST_ACCESSIBLE_BOARD, deleteContent = false, numberOfPost = 50) {
  var feedID = ID ? ID : 'koreatech';
  var feed = new Feed({
    title: '한국기술교육대학교 아우누리 포털',
    description: `한국기술교육대학교 아우누리 포털의 게시글의 피드입니다. 포함 게시판: ${boardIdList.map(id => `${kpbapi.BOARD_ID_MAP_REVERSE[id]}`).filter(e => READY_TO_LOGIN ? true : kpbapi.BOARD_PRIVILEGE_MAP_REVERSE[e] <= 1).join(', ')}`,
    id: 'https://portal.koreatech.ac.kr/',
    link: 'https://portal.koreatech.ac.kr/',
    language: 'ko',
    image: 'https://portal.koreatech.ac.kr/images/logo.png',
    favicon: 'https://portal.koreatech.ac.kr/Portal.ico',
    copyright: 'Copyrightⓒ2016 KOREATECH. All rights reserved.',
    updated: lastUpdated,
    generator: feedID,
    feedLinks: {
      //json: 'https://',
      //atom: 'https://'
    },
    author: {
      name: feedID,
      email: feedID ? `${ID}@koreatech.ac.kr` : void 0,
      // link: 'https://'
    }
  });
  var posts = boardIdList.reduce((a, id) => [...a, ...Object.values(cachedDB[id]).map(e => ((e.board_identifier = id, e)))], []);


  posts = posts.sort((a, b) => {
    var a_cre_dt = a.info ? a.info.cre_dt : a.cre_dt;
    var b_cre_dt = b.info ? b.info.cre_dt : b.cre_dt;
    return new Date(a_cre_dt) < new Date(b_cre_dt) ? -1 : new Date(a_cre_dt) > new Date(b_cre_dt) ? 1 : 0;
  });

  posts = posts.slice(-numberOfPost).reverse();

  posts.forEach(p => {
    var etc = [p.prefix ? `${p.prefix}` : void 0, p.etc0 ? `${p.etc0}` : void 0, p.etc1 ? `${p.etc1}` : void 0, p.etc2 ? `${p.etc2}` : void 0].filter(e => e).join('-').trim();
    var title = `<${kpbapi.BOARD_ID_MAP_REVERSE[p.board_identifier]}>${etc ? ` [${etc}]` : ''} ${p.title}`;
    var feedItem = {
      title,
      id: p.url,
      link: p.url,
      description: title,
      author: [{
        name: p.cre_user_name
      }],
      date: new Date(p.info ? p.info.cre_dt : p.cre_dt),
    };
    if (!deleteContent && p.info) {
      feedItem.content = p.info.content;
    }
    feed.addItem(feedItem);
  });

  return feed;
}

async function init() {
  console.log('Init Feed Server!');
  try {
    await update();
  } catch (e) {
    console.log('Init Failed...');
    process.exit(1);
  }
  setInterval(_ => {
    update().catch(e => {
      console.log('Update Failed...');
    });
  }, UPDATE_TIME);

  app.get('/', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');

    var query = req.query;
    var boardList = query.boardList ? query.boardList.split(',').map(e => kpbapi.BOARD_ID_MAP[e]).filter(e => e) : [];
    if (boardList.length == 0) {
      boardList = void 0;
    }
    var deleteContent = query.deleteContent == 'true' ? true : false;
    var feed = generateFeed(boardList, deleteContent);

    var feedType = query.feedType;
    switch (feedType) {
      default:
      case 'rss':
        res.header('Content-Type', 'text/xml');
        res.send(feed.rss2());
        break;
      case 'atom':
        res.header('Content-Type', 'text/xml');
        res.send(feed.atom1());
        break;
      case 'json':
        res.header('Content-Type', 'text/json');
        res.send(feed.json1());
        break;
    }
  });

  httpServer.listen(port, function() {
    console.log('Listening on port *:' + port);
  });
}

init();
