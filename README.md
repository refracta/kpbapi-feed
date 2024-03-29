# kpbapi-feed
[koreatech-api](https://github.com/refracta/koreatech-api/tree/master/koreatech-portal-board)를 이용한 아우누리 포털 게시판 피드 서버의 구현입니다.
개인 서버 또는 Heroku를 이용하여 사용할 수 있습니다.

## 설치 방법
```
npm install
npm run build
```

## 설정 방법 [(index.js)](https://github.com/refracta/kpbapi-feed/blob/master/index.js)
```
const port = process.env.PORT || 6060;
// 포트를 설정하는 부분입니다.
const UPDATE_TIME = 1000 * 60 * 60 * 1;
// 데이터 갱신 주기를 설정합니다.
var feed = new Feed({
    title: '한국기술교육대학교 아우누리 포털',
    description: `한국기술교육대학교 아우누리 포털의 게시글의 피드입니다. 포함 게시판: ${boardIdList.map(id => `${kpbapi.BOARD_ID_MAP_REVERSE[id]}`)
    .filter(e => READY_TO_LOGIN ? true : kpbapi.BOARD_PRIVILEGE_MAP_REVERSE[e] <= 1).join(', ')}`,
    id: 'https://portal.koreatech.ac.kr/',
    link: 'https://portal.koreatech.ac.kr/',
    language: 'ko',
    image: 'https://portal.koreatech.ac.kr/images/logo.png',
    favicon: 'https://portal.koreatech.ac.kr/Portal.ico',
    copyright: 'Copyrightⓒ2016 KOREATECH. All rights reserved.',
    updated: lastUpdated,
    generator: ID,
    feedLinks: {
        //json: 'https://',
        //atom: 'https://'
    },
    author: {
        name: ID,
        email: `${ID}@koreatech.ac.kr`,
        // link: 'https://'
    }
});
// https://github.com/jpmonette/feed#example 참조
```

## 사용 방법 (개인 서버)
```
npm start [LIGHT_MODE: true or false] [ID] [PW]
예시1) npm start // LIGHT_MODE DEFAULT: false
예시2) npm start true
예시3) npm start false ID PW
예시4) npm start true ID PW
```
LIGHT_MODE 상태에서는 글 내용을 포기하고 글 목록만 가져오기 때문에 일 단위로 게시글 게시 시각이 표시되며 게시글 콘텐츠(HTML) 부분을 기본적으로 피드에서 지원하지 않게됩니다.

ID와 PW없이 실행시 [게시판 권한](https://github.com/refracta/koreatech-api/blob/master/koreatech-portal-board/index.js#L23)에 따라 일부 게시판 정보를 지원하지 않게됩니다.

## 사용 방법 [(Heroku)](https://heroku.com)
```
git clone https://github.com/refracta/kpbapi-feed
cd kpbapi-feed
git commit -m "koreatech-feed"
heroku create HEROKU_APP_NAME
heroku config:set LIGHT_MODE="true"
git push heroku master
https://HEROKU_APP_NAME.herokuapp.com
```
[Heroku Deploy Guide: Windows](https://github.com/refracta/kpbapi-feed/wiki/Heroku-Deploy-Guide:-Windows)


## GET 요청 매개변수
### boardList
피드에 포함할 게시판을 결정합니다. ','로 구분하여 여러 게시판을 동시에 포함시킬 수 있습니다. 값이 없는 경우 지원하는 모든 게시판을 포함시킵니다.

지원 게시판: 코로나19관련공지, 일반공지사항, 학사공지사항, 민원실, 시설보수신청, 학생생활, 자유게시판, 부정행위(시험)신고, 학사행정서식, 교육자료실, 일반자료실, 코리아텍 위키피디아

예시) https://koreatech-feed.koreatech?boardList=자유게시판,일반자료실
### deleteContent
피드에 콘텐츠(HTML) 부분을 삭제하는지에 대한 여부를 결정합니다. true, false의 값을 가질 수 있습니다. 기본값은 false입니다.

예시) https://koreatech-feed.koreatech?deleteContent=true
### feedType
피드의 종류를 결정합니다. rss, atom, json의 값을 가질 수 있습니다. 각각 RSS2, ATOM1, JSON FEED V1의 포맷을 사용하며 기본값은 rss입니다.

예시) https://koreatech-feed.koreatech?feedType=atom

## 기타
[Pushbullet](https://www.pushbullet.com)과 [IFTTT - Send a Pushbullet notification when there's a new RSS feed item](https://ifttt.com/applets/Z6dvekxC-send-a-pushbullet-notification-when-there-s-a-new-rss-feed-item)를 이용하면 다양한 기기에서 푸시 알림을 받을 수 있습니다.

* 무료로 Heroku를 사용하는 경우 [App Sleeping on Heroku](https://blog.heroku.com/app_sleeping_on_heroku) 때문에 [CommaFeed](https://www.commafeed.com)의 피드 캐싱을 이용해야 원활한 사용이 가능합니다. (아래 위키 항목 참조)

[Apply Pushbullet & IFTTT](https://github.com/refracta/kpbapi-feed/wiki/Apply-Pushbullet-&-IFTTT)

Pull Request 환영합니다. 개선 사항, 버그는 Issue에 등록해주세요.
