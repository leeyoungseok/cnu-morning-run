// src/lib/notify.js
// ─── 무료 알림 솔루션 ─────────────────────────────────────────────────────────
// 카카오 알림톡은 유료 비즈니스 채널 필요 → EmailJS 무료 플랜으로 대체
// EmailJS: 월 200건 무료, API 키 없이 브라우저에서 직접 발송
//
// 설정 방법:
//   1. https://emailjs.com 가입 (무료)
//   2. Email Service 연결 (Gmail OK)
//   3. Template 만들기 → 아래 변수 사용
//   4. .env.local에 VITE_EMAILJS_* 설정

import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// EmailJS 템플릿 예시 (EmailJS 콘솔에서 작성):
// 제목: [새벽러너즈] {{event_title}} 내일 오전 {{event_time}} 출발!
// 본문:
//   안녕하세요 {{member_name}}님,
//   내일 달리기가 있습니다!
//   📍 장소: {{event_location}}
//   ⏰ 시간: {{event_time}}
//   🏃 거리: {{event_distance}}
//   늦지 않게 집결해 주세요 🌅

export const sendEventReminder = async ({ memberName, memberEmail, event }) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("[notify] EmailJS 환경변수 미설정 — 알림 생략");
    return;
  }
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    member_name:     memberName,
    to_email:        memberEmail,
    event_title:     event.title,
    event_location:  event.location,
    event_time:      event.time,
    event_distance:  event.distance || "",
    event_date:      event.date,
  }, PUBLIC_KEY);
};

// ─── FCM 웹 푸시 (Firebase, 완전 무료) ───────────────────────────────────────
// 브라우저 알림 권한 요청 후 Firestore에 토큰 저장
// Cloud Functions에서 하루 전 자동 발송

export const saveFcmToken = async (uid, token) => {
  const { db, doc, setDoc } = await import("./firebase");
  await setDoc(doc(db, "fcmTokens", uid), { token, updatedAt: new Date() }, { merge: true });
};

// ─── Cloud Functions 알림 스케줄러 코드 (참고용) ─────────────────────────────
// Firebase Cloud Functions (무료 Spark 플랜에서는 외부 네트워크 불가 → Blaze 업그레이드 필요)
// 그러나 FCM 푸시는 Firebase 내부 통신이라 Spark에서도 동작!
//
// functions/index.js 에 아래 코드 배포:
//
// const {onSchedule} = require("firebase-functions/v2/scheduler");
// const {initializeApp} = require("firebase-admin/app");
// const {getFirestore} = require("firebase-admin/firestore");
// const {getMessaging} = require("firebase-admin/messaging");
//
// initializeApp();
//
// exports.dailyEventReminder = onSchedule("every day 20:00", async () => {
//   const db = getFirestore();
//   const messaging = getMessaging();
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);
//   const dateStr = tomorrow.toISOString().split("T")[0];
//
//   const events = await db.collection("events")
//     .where("date", "==", dateStr).get();
//
//   for (const ev of events.docs) {
//     const event = ev.data();
//     const attendees = await db.collection("attendees")
//       .where("eventId", "==", ev.id)
//       .where("status", "==", "yes").get();
//
//     for (const att of attendees.docs) {
//       const tokenDoc = await db.collection("fcmTokens").doc(att.data().uid).get();
//       if (!tokenDoc.exists) continue;
//       await messaging.send({
//         token: tokenDoc.data().token,
//         notification: {
//           title: `🏃 내일 달리기! ${event.title}`,
//           body: `오전 ${event.time} ${event.location} 집결`,
//         },
//       });
//     }
//   }
// });
