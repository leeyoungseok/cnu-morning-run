// src/pages/ScheduleTab.jsx
import { useState, useEffect } from "react";
import {
  subscribeEvents, createEvent,
  joinEvent, leaveEvent, getAttendees,
} from "../lib/firebase";

export default function ScheduleTab({ user }) {
  const [events, setEvents]     = useState([]);
  const [joined, setJoined]     = useState({});   // eventId → bool
  const [counts, setCounts]     = useState({});   // eventId → number
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: "", date: "", time: "06:00", location: "", distance: "", maxCount: 40 });

  // 실시간 이벤트 구독
  useEffect(() => {
    const unsub = subscribeEvents(async (list) => {
      setEvents(list);
      // 참가자 수 일괄 로드
      const countMap = {};
      await Promise.all(list.map(async (ev) => {
        const att = await getAttendees(ev.id);
        countMap[ev.id] = att.length;
      }));
      setCounts(countMap);
    });
    return unsub;
  }, []);

  // 내 참가 여부 확인
  useEffect(() => {
    if (!user) return;
    const map = {};
    events.forEach(ev => {
      map[ev.id] = false; // 기본값, 실제로는 attendees 조회 필요
    });
    setJoined(map);
  }, [user, events]);

  const handleJoin = async (ev) => {
    if (!user) return alert("로그인이 필요합니다.");
    const isJoined = joined[ev.id];
    if (isJoined) {
      await leaveEvent(ev.id, user.uid);
    } else {
      await joinEvent(ev.id, user.uid, user.displayName, "");
    }
    setJoined(p => ({ ...p, [ev.id]: !isJoined }));
    setCounts(p => ({ ...p, [ev.id]: (p[ev.id] || 0) + (isJoined ? -1 : 1) }));
  };

  const handleCreate = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!form.title || !form.date) return alert("이름과 날짜를 입력해 주세요.");
    await createEvent({ ...form, maxCount: Number(form.maxCount), createdBy: user.uid });
    setForm({ title: "", date: "", time: "06:00", location: "", distance: "", maxCount: 40 });
    setShowForm(false);
  };

  const dows = ["일","월","화","수","목","금","토"];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <span style={{ fontSize:12, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>다가오는 런</span>
        {user && (
          <button className="join-btn" onClick={() => setShowForm(s => !s)}>
            {showForm ? "취소" : "+ 일정 추가"}
          </button>
        )}
      </div>

      {/* 일정 추가 폼 */}
      {showForm && (
        <div style={{ background:"#f8f7f5", borderRadius:12, padding:16, marginBottom:16, border:"0.5px dashed #ddd" }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>새 런 일정</h3>
          {[
            { label:"이벤트 이름", key:"title",    type:"text",   placeholder:"예) 대전천 정기 아침런" },
            { label:"날짜",       key:"date",     type:"date",   placeholder:"" },
            { label:"시간",       key:"time",     type:"time",   placeholder:"" },
            { label:"집결 장소",  key:"location", type:"text",   placeholder:"예) 대전천 둔치 입구" },
            { label:"거리",       key:"distance", type:"text",   placeholder:"예) 5km" },
            { label:"최대 인원",  key:"maxCount", type:"number", placeholder:"40" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:8 }}>
              <label style={{ fontSize:12, color:"#666", display:"block", marginBottom:3 }}>{f.label}</label>
              <input
                type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width:"100%", padding:"8px 10px", border:"0.5px solid #ddd",
                         borderRadius:8, fontSize:14 }}
              />
            </div>
          ))}
          <button className="join-btn" style={{ width:"100%", marginTop:6, padding:"10px" }} onClick={handleCreate}>
            등록하기
          </button>
        </div>
      )}

      {/* 이벤트 목록 */}
      {events.length === 0 && (
        <p style={{ textAlign:"center", color:"#999", padding:"40px 0", fontSize:14 }}>
          등록된 일정이 없습니다.<br />첫 런 일정을 추가해 보세요!
        </p>
      )}

      {events.map(ev => {
        const d = ev.date ? new Date(ev.date) : null;
        const day = d ? d.getDate() : "?";
        const dow = d ? dows[d.getDay()] : "";
        const count = counts[ev.id] || 0;
        const full  = count >= Number(ev.maxCount || 40);
        const isJoined = joined[ev.id];

        return (
          <div key={ev.id} className="event-card">
            <div className="event-date" style={{ minWidth:48, textAlign:"center",
              background:"#f8f7f5", borderRadius:8, padding:"8px 6px" }}>
              <div className="day">{day}</div>
              <div className="dow">{dow}</div>
            </div>
            <div style={{ flex:1 }}>
              <div className="event-title">{ev.title}</div>
              <div className="event-meta">
                {ev.time     && <span>⏰ {ev.time}</span>}
                {ev.location && <span>📍 {ev.location}</span>}
                {ev.distance && <span>📏 {ev.distance}</span>}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:12, color:"#888", marginBottom:6 }}>
                👤 {count}/{ev.maxCount || 40}
              </div>
              {full && !isJoined
                ? <button className="join-btn full" disabled>마감</button>
                : <button
                    className={`join-btn ${isJoined ? "joined" : ""}`}
                    onClick={() => handleJoin(ev)}
                  >
                    {isJoined ? "참가중 ✓" : "참가"}
                  </button>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}
