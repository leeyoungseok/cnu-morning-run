// src/App.jsx
import { useState, useEffect } from "react";
import { auth, loginWithGoogle, logout, getHeroMedia, upsertMember } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { HeroMediaPlayer } from "./components/MediaEmbed";
import ScheduleTab  from "./pages/ScheduleTab";
import MembersTab   from "./pages/MembersTab";
import GalleryTab   from "./pages/GalleryTab";
import AttendanceTab from "./pages/AttendanceTab";
import "./styles/app.css";

export default function App() {
  const [user, setUser]   = useState(null);
  const [tab, setTab]     = useState("schedule");
  const [hero, setHero]   = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // 인증 상태 구독
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // 첫 로그인 시 Firestore에 멤버 정보 저장
        await upsertMember(u.uid, {
          name: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
        });
      }
    });
  }, []);

  // 대표 영상 로드
  useEffect(() => {
    getHeroMedia().then(setHero);
  }, []);

  const tabs = [
    { id: "schedule",   label: "일정",   icon: "📅" },
    { id: "members",    label: "멤버",   icon: "👥" },
    { id: "gallery",    label: "갤러리", icon: "🖼️" },
    { id: "attendance", label: "출석",   icon: "✅" },
  ];

  return (
    <div className="app">
      {/* 상단 네비 */}
      <header className="topbar">
        <div className="logo">
          <span className="logo-icon">🏃</span>
          <div>
            <div className="logo-name">CNU 컴인 러너즈</div>
            <div className="logo-sub">충남대 아침 달리기 동호회</div>
          </div>
        </div>
        <div className="auth-area">
          {user ? (
            <div className="user-menu">
              <img
                src={user.photoURL || "/default-avatar.png"}
                alt={user.displayName}
                className="user-avatar"
                onClick={() => setMenuOpen(m => !m)}
              />
              {menuOpen && (
                <div className="dropdown">
                  <p className="dropdown-name">{user.displayName}</p>
                  <p className="dropdown-email">{user.email}</p>
                  <button onClick={() => { logout(); setMenuOpen(false); }}>로그아웃</button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={loginWithGoogle}>
              Google로 로그인
            </button>
          )}
        </div>
      </header>

      {/* 홈 히어로 — 대표 영상 */}
      {hero ? (
        <HeroMediaPlayer media={hero} />
      ) : (
        <div className="hero-banner">
          <div className="hero-badge">🌅 매주 일요일 오전 6:00 유림공원 집결</div>
          <h1>새벽을 함께 달리는<br />충남대 컴인 러닝 크루</h1>
          <p>몸도 마음도 깨어나는 아침, 우리와 함께 달려요</p>
          <div className="hero-stats">
            <div><span className="stat-num">38</span><span className="stat-lbl">활동 멤버</span></div>
            <div><span className="stat-num">127</span><span className="stat-lbl">누적 런</span></div>
            <div><span className="stat-num">5.2km</span><span className="stat-lbl">평균 코스</span></div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <nav className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* 패널 */}
      <main className="panel">
        {!user && (
          <div className="login-prompt">
            <p>로그인하면 일정 참가, 사진 공유, 출석 확인이 가능합니다.</p>
            <button className="login-btn" onClick={loginWithGoogle}>Google로 시작하기</button>
          </div>
        )}
        {tab === "schedule"   && <ScheduleTab   user={user} />}
        {tab === "members"    && <MembersTab    user={user} />}
        {tab === "gallery"    && <GalleryTab    user={user} />}
        {tab === "attendance" && <AttendanceTab user={user} />}
      </main>
    </div>
  );
}
