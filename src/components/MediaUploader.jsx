// src/components/MediaUploader.jsx
// 링크(YouTube, Drive, URL) 입력 + 파일 직접 업로드 두 가지 모드

import { useState } from "react";
import { addMediaLink, uploadMediaFile, setHeroMedia, detectLinkType } from "../lib/firebase";

export default function MediaUploader({ eventId, uid, onClose, onDone }) {
  const [mode, setMode]       = useState("link"); // "link" | "file"
  const [url, setUrl]         = useState("");
  const [title, setTitle]     = useState("");
  const [isFeatured, setFeatured] = useState(false);
  const [file, setFile]       = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const linkType = detectLinkType(url);
  const linkHint = {
    youtube: "✅ YouTube 링크 인식됨 — 임베드로 재생됩니다",
    gdrive:  "✅ Google Drive 링크 인식됨",
    image_url: "✅ 이미지 URL 인식됨",
    video_url: "✅ 동영상 URL 인식됨",
    link:    "🔗 일반 링크로 저장됩니다",
    unknown: url ? "URL을 확인해 주세요" : "",
  };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      let result;
      if (mode === "link") {
        if (!url) { setError("URL을 입력해 주세요."); return; }
        result = await addMediaLink(eventId, url, title || url, uid, isFeatured);
        if (isFeatured) await setHeroMedia(result.id, url, title || url);
      } else {
        if (!file) { setError("파일을 선택해 주세요."); return; }
        result = await uploadMediaFile(file, eventId, uid, setProgress);
        if (isFeatured) await setHeroMedia(result.id, result.url, title || file.name);
      }
      onDone?.();
      onClose?.();
    } catch (e) {
      setError("업로드 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploader-overlay">
      <div className="uploader-modal">
        <div className="uploader-header">
          <h3>사진 · 동영상 추가</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 탭 */}
        <div className="mode-tabs">
          <button className={mode === "link" ? "active" : ""} onClick={() => setMode("link")}>
            🔗 링크로 추가
          </button>
          <button className={mode === "file" ? "active" : ""} onClick={() => setMode("file")}>
            📁 파일 업로드
          </button>
        </div>

        {/* 링크 모드 */}
        {mode === "link" && (
          <div className="input-group">
            <label>URL 붙여넣기</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=... 또는 drive.google.com/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            {url && <p className={`link-hint ${linkType}`}>{linkHint[linkType]}</p>}

            <label>제목 (선택)</label>
            <input
              type="text"
              placeholder="예) 5월 20일 대전천 런 하이라이트"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        )}

        {/* 파일 업로드 모드 */}
        {mode === "file" && (
          <div className="input-group">
            <label
              className="file-drop"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
            >
              {file
                ? <span>📎 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                : <span>클릭 또는 끌어서 놓기<br /><small>JPG · PNG · MP4 · MOV 지원</small></span>
              }
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: "none" }}
                onChange={e => setFile(e.target.files[0])}
              />
            </label>
            {progress > 0 && progress < 100 && (
              <div className="progress-bar">
                <div style={{ width: `${progress}%` }} />
                <span>{progress}%</span>
              </div>
            )}
          </div>
        )}

        {/* 대표 영상 체크 */}
        <label className="featured-check">
          <input type="checkbox" checked={isFeatured} onChange={e => setFeatured(e.target.checked)} />
          홈 화면 대표 영상으로 설정
        </label>

        {error && <p className="error-msg">{error}</p>}

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
