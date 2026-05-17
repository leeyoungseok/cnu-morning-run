# 🏃 새벽러너즈 — 충남대 아침 달리기 동호회

완전 무료 스택으로 구축한 동호회 웹 애플리케이션입니다.

## 무료 서비스 구성

| 서비스 | 용도 | 무료 한도 |
|---|---|---|
| Firebase Hosting | 웹 배포 | 무제한 (10GB 대역폭/월) |
| Firebase Auth | Google 로그인 | 무제한 |
| Firestore | DB (일정·출석·멤버) | 1GB, 5만 읽기/일 |
| Firebase Storage | 사진·동영상 직접 업로드 | 5GB |
| Firebase Functions | 알림 스케줄러 | 200만 호출/월 |
| FCM | 웹 푸시 알림 | 무제한 |
| EmailJS | 이메일 알림 | 200건/월 |
| YouTube 임베드 | 동영상 링크 | 무제한 |
| Google Drive 임베드 | 사진·동영상 링크 | 무제한 |

## 시작하기

### 1. Firebase 프로젝트 생성

1. [Firebase 콘솔](https://console.firebase.google.com) → 새 프로젝트 생성
2. **Authentication** → 시작하기 → Google 제공업체 활성화
3. **Firestore** → 데이터베이스 만들기 → 테스트 모드로 시작
4. **Storage** → 시작하기 → 기본 규칙 적용
5. **Hosting** → 시작하기

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
# .env.local을 열어 Firebase 콘솔에서 복사한 값 채우기
```

### 3. Firestore 보안 규칙

Firebase 콘솔 → Firestore → 규칙 탭에 붙여넣기:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 멤버: 본인만 수정 가능, 전체 읽기 가능
    match /members/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    // 이벤트: 로그인 사용자만 생성, 전체 읽기
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // 출석: 본인 참가/취소만
    match /attendees/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // 미디어: 로그인 사용자만 추가
    match /media/{mediaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // 설정: 로그인 사용자만 변경
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Storage 보안 규칙

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 100 * 1024 * 1024; // 100MB 제한
    }
  }
}
```

### 5. 개발 서버 실행

```bash
npm install
npm run dev
```

### 6. 배포

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # 빌드 디렉토리: dist
npm run deploy
```

## 미디어 추가 방법

### YouTube 링크
- 유튜브 동영상 URL 복사 → 갤러리 탭 → "링크로 추가" → 붙여넣기
- 자동으로 임베드 플레이어로 표시됩니다

### Google Drive 링크
- Drive에서 파일 → 공유 → "링크가 있는 모든 사용자" → URL 복사
- 갤러리 탭 → 붙여넣기

### 직접 업로드
- 갤러리 탭 → "파일 업로드" → 사진(JPG/PNG) 또는 동영상(MP4/MOV) 선택
- Firebase Storage에 저장 (무료 5GB)

### 대표 영상 설정
- 업로드/링크 추가 시 "홈 화면 대표 영상으로 설정" 체크
- 또는 갤러리에서 미디어 우측 상단 ★ 버튼 클릭

## 프로젝트 구조

```
src/
├── lib/
│   ├── firebase.js     # Firebase 초기화 + 모든 DB 함수
│   └── notify.js       # EmailJS 이메일 알림
├── components/
│   ├── MediaEmbed.jsx  # YouTube/Drive/파일 통합 임베드
│   └── MediaUploader.jsx # 링크 입력 + 파일 업로드 모달
├── pages/
│   ├── ScheduleTab.jsx
│   ├── MembersTab.jsx
│   ├── GalleryTab.jsx
│   └── AttendanceTab.jsx
├── styles/
│   └── app.css
└── App.jsx
```
