# 대강당을 탈출하자!! 🎮

**보물상자 퍼즐 기반의 방탈출 게임**

Node.js와 Express.js를 사용한 태블릿 최적화 방탈출 게임입니다.

## 🎯 주요 기능

- **보물상자 퍼즐**: 자물쇠가 잠긴 보물상자와 비밀번호 입력 시스템
- **폭발 효과**: 정답 입력 시 보물상자가 폭발하며 파티클 효과
- **문제보기**: 퍼즐 문제를 확인할 수 있는 모달 창
- **다음 활동지 안내**: 성공 시 대운동장으로 이동 안내
- **실시간 통신**: Socket.IO를 통한 서버-클라이언트 실시간 통신
- **태블릿 최적화**: 반응형 디자인과 터치 인터페이스
- **게임 통계**: 시도 횟수와 타이머 기능

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 프로덕션 서버 실행

```bash
npm start
```

## API 엔드포인트

### 기본 정보
- `GET /` - 서버 상태 확인

### 방 관리
- `GET /api/game/rooms` - 모든 방 목록 조회
- `GET /api/game/rooms/:roomId` - 특정 방 정보 조회
- `POST /api/game/rooms` - 새 방 생성
- `DELETE /api/game/rooms/:roomId` - 방 삭제

### 플레이어 관리
- `GET /api/game/players/:playerId` - 플레이어 정보 조회

### 통계
- `GET /api/game/stats` - 게임 통계 조회

## Socket.IO 이벤트

### 클라이언트 → 서버
- `join-room` - 방 입장
- `start-game` - 게임 시작
- `end-game` - 게임 종료

### 서버 → 클라이언트
- `player-joined` - 플레이어 입장 알림
- `player-left` - 플레이어 퇴장 알림
- `game-started` - 게임 시작 알림
- `game-ended` - 게임 종료 알림

## 🏗️ 기술 스택

### Backend
- **Node.js** + **Express.js**: 서버 프레임워크
- **Socket.IO**: 실시간 양방향 통신
- **Helmet, CORS, Morgan**: 보안 및 로깅 미들웨어
- **Jest + Supertest**: 테스트 프레임워크

### Frontend
- **HTML5**: 게임 구조
- **CSS3**: 반응형 디자인, 3D 애니메이션, 파티클 효과
- **JavaScript**: 게임 로직, DOM 조작, 이벤트 처리

## 📁 프로젝트 구조

```
camping trin/
├── server.js              # 메인 서버 파일
├── package.json           # 프로젝트 설정 및 의존성
├── config.js              # 설정 파일
├── routes/
│   ├── game.js           # 게임 관련 API
│   ├── rooms.js          # 방 관리 API
│   └── players.js        # 플레이어 관리 API
├── public/
│   ├── index.html        # 메인 게임 페이지
│   ├── styles.css        # 스타일시트
│   ├── script.js         # 클라이언트 로직
│   ├── background.png    # 배경 이미지
│   └── Q1.png           # 문제 이미지
├── test/
│   └── server.test.js    # 서버 테스트
├── README.md             # 프로젝트 설명
└── .gitignore           # Git 제외 파일
```

## 환경 변수

`.env` 파일을 생성하여 다음 환경 변수를 설정할 수 있습니다:

```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 개발 계획

- [ ] 데이터베이스 연동 (PostgreSQL/MongoDB)
- [ ] 사용자 인증 시스템
- [ ] 게임 로직 구현
- [ ] 퍼즐 시스템
- [ ] 타이머 기능
- [ ] 힌트 시스템
- [ ] 게임 기록 저장
- [ ] 관리자 패널

## 라이선스

MIT License
