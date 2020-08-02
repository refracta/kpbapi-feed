# koreatech-feed
API를 이용한 게시판 Feed 서버의 구현입니다.

한국기술대학교 전산정보팀 측과의 통화 결과 이유 불문하고 피드 서버 주소의 공개 배포 지양을 종용했으므로 개인 사용을 권고합니다. 따라서 직접 피드 주소를 제공하지 않고 개인 서버 또는 Heroku를 이용한 사용 방법을 추천합니다.

## 설치 방법
```
npm install
npm run build
```

## 설정 방법 [(index.js)](https://github.com/refracta/kpbapi-feed/blob/master/index.js)
```
const port = process.env.PORT || 6060;
// 포트를 설정하는 부분입니다.
const UPDATE_TIME = 1000 * 60 * 5;
// 데이터 갱신 주기를 설정합니다.
var feed = new Feed({
    title: '한국기술교육대학교 아우누리 포털',
    description: `한국기술교육대학교 아우누리 포털의 게시글의 피드입니다. 포함 게시판: ${boardIdList.map(id => ` $ {
        kpbapi.BOARD_ID_MAP_REVERSE[id]
    }
    게시판 `).join(', ')}`,
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
npm start ID PW
```

## 사용 방법 [(Heroku)](https://heroku.com)
```
git clone https://github.com/refracta/kpbapi-feed
cd kpbapi-feed
git commit -m "koreatech-feed"
heroku create HEROKU_APP_NAME
heroku config:set KOREATECH_ID="ID"
heroku config:set KOREATECH_PW="PW"
git push heroku master
https://HEROKU_APP_NAME.herokuapp.com
```

## 기타
Pull Request 환영합니다. 개선 사항, 버그는 Issue에 등록해주세요.
