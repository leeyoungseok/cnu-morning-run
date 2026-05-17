// src/lib/firebase.js
// ✅ 무료 Firebase Spark 플랜 — API 키는 .env.local에서 관리
// .env.local 파일을 만들고 아래 변수를 채우세요 (Firebase 콘솔 → 프로젝트 설정 → 내 앱)

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  getFirestore, collection, doc,
  getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

// FCM은 HTTPS 환경에서만 동작 (localhost 개발 시 skip)
export let messaging = null;
if (typeof window !== "undefined" && "Notification" in window) {
  try { messaging = getMessaging(app); } catch (_) {}
}

// ─── Auth ───────────────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// ─── Members ────────────────────────────────────────────────────────────────
export const upsertMember = (uid, data) =>
  setDoc(doc(db, "members", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });

export const getMember = (uid) =>
  getDoc(doc(db, "members", uid)).then(s => s.exists() ? s.data() : null);

export const getMembers = () =>
  getDocs(collection(db, "members")).then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

// ─── Events ─────────────────────────────────────────────────────────────────
export const createEvent = (data) =>
  addDoc(collection(db, "events"), { ...data, createdAt: serverTimestamp() });

export const getEvents = () =>
  getDocs(query(collection(db, "events"), orderBy("date", "asc")))
    .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

export const subscribeEvents = (callback) =>
  onSnapshot(
    query(collection(db, "events"), orderBy("date", "asc")),
    s => callback(s.docs.map(d => ({ id: d.id, ...d.data() })))
  );

// ─── Attendees ───────────────────────────────────────────────────────────────
export const joinEvent = (eventId, uid, name, dept) =>
  setDoc(doc(db, "attendees", `${eventId}_${uid}`), {
    eventId, uid, name, dept, status: "yes", joinedAt: serverTimestamp(),
  });

export const leaveEvent = (eventId, uid) =>
  deleteDoc(doc(db, "attendees", `${eventId}_${uid}`));

export const getAttendees = (eventId) =>
  getDocs(query(collection(db, "attendees"), where("eventId", "==", eventId)))
    .then(s => s.docs.map(d => d.data()));

export const subscribeAttendees = (eventId, callback) =>
  onSnapshot(
    query(collection(db, "attendees"), where("eventId", "==", eventId)),
    s => callback(s.docs.map(d => d.data()))
  );

// ─── Media ───────────────────────────────────────────────────────────────────
// 링크 등록 (YouTube, Google Drive, 일반 URL)
export const addMediaLink = (eventId, url, title, uploadedBy, isFeatured = false) => {
  const type = detectLinkType(url);
  return addDoc(collection(db, "media"), {
    eventId, url, title, type,
    isFeatured, uploadedBy,
    createdAt: serverTimestamp(),
  });
};

// 직접 파일 업로드 → Firebase Storage
export const uploadMediaFile = (file, eventId, uid, onProgress) => {
  const ext = file.name.split(".").pop();
  const path = `media/${eventId}/${uid}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on("state_changed",
      snap => onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        const isVideo = file.type.startsWith("video/");
        const doc = await addDoc(collection(db, "media"), {
          eventId, url: downloadURL, title: file.name,
          type: isVideo ? "storage_video" : "storage_image",
          isFeatured: false, uploadedBy: uid,
          createdAt: serverTimestamp(),
        });
        resolve({ id: doc.id, url: downloadURL });
      }
    );
  });
};

export const getMedia = (eventId) =>
  getDocs(query(collection(db, "media"), where("eventId", "==", eventId)))
    .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

// 대표 영상 (홈 히어로) 가져오기/설정
export const getHeroMedia = () =>
  getDoc(doc(db, "settings", "hero")).then(s => s.exists() ? s.data() : null);

export const setHeroMedia = (mediaId, url, title) =>
  setDoc(doc(db, "settings", "hero"), { mediaId, url, title, type: detectLinkType(url), updatedAt: serverTimestamp() });

// ─── URL 타입 감지 ────────────────────────────────────────────────────────────
export const detectLinkType = (url) => {
  if (!url) return "unknown";
  if (/youtube\.com|youtu\.be/.test(url))  return "youtube";
  if (/drive\.google\.com/.test(url))       return "gdrive";
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return "image_url";
  if (/\.(mp4|mov|webm)$/i.test(url))       return "video_url";
  return "link";
};

// YouTube URL → embed URL 변환
export const toYouTubeEmbed = (url) => {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=0` : null;
};

// Google Drive → embed URL 변환
export const toDriveEmbed = (url) => {
  const m = url.match(/\/d\/([^/]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
};

// ─── FCM 웹 푸시 (선택 사항) ──────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  return getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
};

export { serverTimestamp };
