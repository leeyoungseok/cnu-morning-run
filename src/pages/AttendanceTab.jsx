// src/pages/AttendanceTab.jsx
import { useState, useEffect } from "react";
import { getEvents, subscribeAttendees } from "../lib/firebase";

const COLORS = ["#FF6B35","#4ECDC4","#A29BFE","#FD79A8","#6C5CE7","#00B894","#FDCB6E","#E17055"];

export default function AttendanceTab({ user }) {
  const [events, setEvents]       = useState([]);
  const [selectedId, setSelected] = useState("");
  const [attendees, setAttendees] = useState([]);

  useEffect(() => {
    getEvents().then(list => {
      setEvents(list);
      if (list.length > 0) setSelected(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const unsub = subscribeAttendees(selectedId, setAttendees);
    return unsub;
  }, [selectedId]);

  const yes     = attendees.filter(a => a.status === "yes").length;
  const no      = attendees.filter(a => a.status === "no").length;
  const pending = attendees.filter(a => a.status === "pending").length;

  const selectedEvent = events.find(e => e.id === selectedId);

  return (
    <div>
      {/* 이벤트 선택 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <span style={{ fontSize:15, fontWeight:600 }}>출석 확인</span>
        <select
          value={selectedId}
          onChange={e => setSelected(e.target.value)}
          style={{ fontSize:13, padding:"6px 10px", borderRadius:8,
                   border:"0.5px solid #ddd", background:"#fff" }}
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.date} {ev.title}</option>
          ))}
        </select>
      </div>

      {/* 요약 통계 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        {[
          { label:"참가 확정", n:yes,     bg:"#f0fdf4", c:"#166534" },
          { label:"미확인",   n:pending,  bg:"#fff7ed", c:"#c2410c" },
          { label:"불참",     n:no,       bg:"#fef2f2", c:"#991b1b" },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.n}</div>
            <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 참가자 명단 */}
      <div style={{ fontSize:12, color:"#888", fontWeight:600, textTransform:"uppercase",
                    letterSpacing:".04em", marginBottom:10 }}>
        참가자 명단
      </div>

      {attendees.length === 0 && (
        <p style={{ textAlign:"center", color:"#999", padding:"30px 0", fontSize:14 }}>
          {selectedEvent ? "아직 참가 신청자가 없습니다." : "이벤트를 선택해 주세요."}
        </p>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {attendees.map((a, i) => {
          const statusMap = {
            yes:     { label:"참가",  bg:"#f0fdf4", color:"#166534" },
            no:      { label:"불참",  bg:"#fef2f2", color:"#991b1b" },
            pending: { label:"미확인", bg:"#fff7ed", color:"#c2410c" },
          };
          const s = statusMap[a.status] || statusMap.pending;
          const color = COLORS[i % COLORS.length];
          const initial = (a.name || "?")[0];

          return (
            <div key={a.uid} style={{ display:"flex", alignItems:"center", gap:12,
              padding:"10px 14px", background:"#fff", border:"0.5px solid #eee",
              borderRadius:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:color,
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:600, flexShrink:0 }}>
                {initial}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{a.name}</div>
                {a.dept && <div style={{ fontSize:11, color:"#888" }}>{a.dept}</div>}
              </div>
              <span style={{ padding:"3px 10px", borderRadius:10, fontSize:11,
                fontWeight:600, background:s.bg, color:s.color }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
