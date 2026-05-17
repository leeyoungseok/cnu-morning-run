// src/components/MediaEmbed.jsx
// YouTube 링크, Google Drive 링크, 직접 업로드 파일 모두 처리

import { toYouTubeEmbed, toDriveEmbed } from "../lib/firebase";

export default function MediaEmbed({ media, className = "", controls = true }) {
  if (!media?.url) return null;
  const { url, type, title } = media;

  switch (type) {
    case "youtube": {
      const embedUrl = toYouTubeEmbed(url);
      if (!embedUrl) return <a href={url} target="_blank" rel="noreferrer">{title}</a>;
      return (
        <div className={`media-embed youtube ${className}`}>
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    case "gdrive": {
      const embedUrl = toDriveEmbed(url);
      if (!embedUrl) return <a href={url} target="_blank" rel="noreferrer">{title}</a>;
      return (
        <div className={`media-embed gdrive ${className}`}>
          <iframe src={embedUrl} title={title} allowFullScreen loading="lazy" />
        </div>
      );
    }

    case "storage_video":
    case "video_url":
      return (
        <div className={`media-embed video ${className}`}>
          <video src={url} controls={controls} playsInline preload="metadata">
            영상을 재생할 수 없습니다.
          </video>
        </div>
      );

    case "storage_image":
    case "image_url":
      return (
        <div className={`media-embed image ${className}`}>
          <img src={url} alt={title} loading="lazy" />
        </div>
      );

    default:
      return (
        <a href={url} target="_blank" rel="noreferrer" className="media-link">
          🔗 {title || url}
        </a>
      );
  }
}

// ─── 대표 영상 히어로 플레이어 (홈 화면 최상단) ───────────────────────────────
export function HeroMediaPlayer({ media }) {
  if (!media) return null;
  const isYoutube = media.type === "youtube";
  const isGdrive  = media.type === "gdrive";

  return (
    <div className="hero-media">
      {(isYoutube || isGdrive)
        ? <MediaEmbed media={media} className="hero-embed" controls={false} />
        : media.type?.includes("video")
          ? <video src={media.url} autoPlay muted loop playsInline className="hero-video" />
          : <img src={media.url} alt={media.title} className="hero-img" />
      }
      {media.title && <p className="hero-caption">{media.title}</p>}
    </div>
  );
}

// ─── 갤러리 썸네일 ────────────────────────────────────────────────────────────
export function MediaThumbnail({ media, onClick }) {
  const isVideo = media.type?.includes("video") || media.type === "youtube" || media.type === "gdrive";
  const thumbUrl = media.type === "youtube"
    ? `https://img.youtube.com/vi/${getYouTubeId(media.url)}/mqdefault.jpg`
    : media.type?.includes("image")
      ? media.url
      : null;

  return (
    <div className="media-thumb" onClick={onClick} role="button" tabIndex={0}>
      {thumbUrl
        ? <img src={thumbUrl} alt={media.title} loading="lazy" />
        : <div className="media-thumb-placeholder">
            {isVideo ? "🎬" : "📎"}
          </div>
      }
      {isVideo && <span className="play-badge">▶</span>}
      <p className="thumb-label">{media.title || "미디어"}</p>
    </div>
  );
}

function getYouTubeId(url) {
  const m = url?.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : "";
}
