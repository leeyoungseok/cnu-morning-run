// src/pages/GalleryTab.jsx
import { useState, useEffect } from "react";
import { getMedia, setHeroMedia } from "../lib/firebase";
import MediaUploader from "../components/MediaUploader";
//import { MediaThumbnail, MediaEmbed } from "../components/MediaEmbed";
import MediaEmbed, { MediaThumbnail } from "../components/MediaEmbed";

export default function GalleryTab({ user }) {
  const [mediaList, setMediaList] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selected, setSelected]   = useState(null);    // 전체화면 뷰
  const [eventFilter, setEventFilter] = useState("all");

  const load = () => getMedia("all").then(setMediaList);
  useEffect(() => { load(); }, []);

  const featured = mediaList.find(m => m.isFeatured);
  const rest = mediaList.filter(m => !m.isFeatured);

  return (
    <div className="gallery-tab">

      {/* 대표 영상 선택 안내 */}
      {user && (
        <div className="gallery-toolbar">
          <button className="upload-trigger" onClick={() => setShowUploader(true)}>
            + 사진·동영상 추가
          </button>
          <span className="gallery-hint">
            YouTube / Google Drive 링크를 붙여넣거나 파일을 직접 올리세요
          </span>
        </div>
      )}

      {/* 현재 대표 영상 표시 */}
      {featured && (
        <div className="featured-section">
          <h3 className="section-title">대표 영상</h3>
          <MediaEmbed media={featured} className="featured-embed" />
          <p className="featured-label">{featured.title}</p>
        </div>
      )}

      {/* 갤러리 그리드 */}
      {rest.length === 0 && !featured ? (
        <div className="empty-state">
          <p>아직 미디어가 없습니다.</p>
          <p>YouTube 링크나 Google Drive 링크를 추가해 보세요!</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {rest.map(m => (
            <div key={m.id} className="gallery-item">
              <MediaThumbnail media={m} onClick={() => setSelected(m)} />
              {user && (
                <button
                  className="set-hero-btn"
                  title="대표 영상으로 설정"
                  onClick={() => setHeroMedia(m.id, m.url, m.title).then(load)}
                >
                  ★
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 전체화면 뷰어 */}
      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelected(null)}>✕</button>
            <MediaEmbed media={selected} className="lightbox-embed" />
            <p className="lightbox-title">{selected.title}</p>
          </div>
        </div>
      )}

      {/* 업로더 모달 */}
      {showUploader && (
        <MediaUploader
          eventId="all"
          uid={user?.uid}
          onClose={() => setShowUploader(false)}
          onDone={load}
        />
      )}
    </div>
  );
}
