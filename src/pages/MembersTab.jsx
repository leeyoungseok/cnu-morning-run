// src/pages/MembersTab.jsx
import { useState, useEffect } from "react";
import { getMembers } from "../lib/firebase";

const COLORS = ["#FF6B35","#4ECDC4","#A29BFE","#FD79A8","#6C5CE7","#00B894","#FDCB6E","#E17055"];

export default function MembersTab({ user }) {
  const [members, setMembers] = useState([]);

  useEffect(() => { getMembers().then(setMembers); }, []);

  const badge = (runs) => {
    if (runs >= 30) return { label: "베테랑", bg: "#f0fdf4", color: "#166534" };
    if (runs >= 10) return { label: "런너",   bg: "#eff6ff", color: "#1d4ed8" };
    return              { label: "루키",    bg: "#fff7ed", color: "#c2410c" };
  };

  return (
    <div>
      <div style={{ fontSize:12, color:"#888", fontWeight:600, textTransform:"uppercase",
                    letterSpacing:".04em", marginBottom:14 }}>
        전체 멤버 {members.length}명
      </div>

      {members.length === 0 && (
        <p style={{ textAlign:"center", color:"#999", padding:"40px 0", fontSize:14 }}>
          아직 멤버가 없습니다.<br />로그인하면 자동으로 등록됩니다.
        </p>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
        {members.map((m, i) => {
          const b = badge(m.runs || 0);
          const color = COLORS[i % COLORS.length];
          const initial = (m.name || "?")[0];
          return (
            <div key={m.id} style={{ background:"#fff", border:"0.5px solid #eee",
              borderRadius:12, padding:"16px 12px", textAlign:"center" }}>
              {m.photoURL
                ? <img src={m.photoURL} alt={m.name}
                    style={{ width:48, height:48, borderRadius:"50%", margin:"0 auto 10px",
                             display:"block", objectFit:"cover" }} />
                : <div style={{ width:48, height:48, borderRadius:"50%", background:color,
                    color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:600, fontSize:18, margin:"0 auto 10px" }}>
                    {initial}
                  </div>
              }
              <div style={{ fontSize:13, fontWeight:600, marginBottom:3, overflow:"hidden",
                            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {m.name || "이름 없음"}
              </div>
              {m.dept && (
                <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>{m.dept}</div>
              )}
              <div style={{ fontSize:11, color:"#FF6B35", fontWeight:600, marginBottom:6 }}>
                🏃 {m.runs || 0}회
              </div>
              <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:10,
                fontSize:10, background:b.bg, color:b.color, fontWeight:600 }}>
                {b.label}
              </span>
              {m.id === user?.uid && (
                <div style={{ fontSize:10, color:"#FF6B35", marginTop:4 }}>나</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
