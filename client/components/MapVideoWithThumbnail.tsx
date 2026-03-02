import React, { useState, useCallback, useMemo } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapVideoWithThumbnailProps {
  /** Video URL (YouTube, Vimeo, or direct video file). */
  videoUrl: string;
  /** Optional thumbnail URL. If not provided, YouTube thumbnails are auto-derived. */
  thumbnailUrl?: string | null;
  /** Optional title for accessibility and fallback alt text. */
  title?: string;
  /** Optional class name for the outer wrapper. */
  className?: string;
}

const YOUTUBE_THUMBNAIL_REGEX =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;

const extractYouTubeId = (url: string): string | null => {
  const match = url.trim().match(YOUTUBE_THUMBNAIL_REGEX);
  return match ? match[1] : null;
};

const getYouTubeThumbnailUrl = (url: string): string | null => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
};

const isYouTubeUrl = (url: string): boolean => Boolean(extractYouTubeId(url));

/** Default placeholder data URL for a simple 16:9 gray gradient (avoids external request). */
const DEFAULT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%23e5e7eb' width='16' height='9'/%3E%3C/svg%3E";

export function MapVideoWithThumbnail({
  videoUrl,
  thumbnailUrl,
  title = "Video",
  className,
}: MapVideoWithThumbnailProps) {
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const effectiveThumbnail = useMemo(() => {
    if (thumbnailUrl?.trim()) return thumbnailUrl.trim();
    const ytThumb = getYouTubeThumbnailUrl(videoUrl);
    return ytThumb ?? DEFAULT_PLACEHOLDER;
  }, [videoUrl, thumbnailUrl]);

  const isPlaceholder = effectiveThumbnail === DEFAULT_PLACEHOLDER;
  const showThumbnailImage =
    !isPlaceholder && !thumbnailError && (thumbnailLoaded || !hasStartedPlaying);

  const handleThumbnailLoad = useCallback(() => setThumbnailLoaded(true), []);
  const handleThumbnailError = useCallback(() => setThumbnailError(true), []);

  const handlePlayClick = useCallback(() => {
    setHasStartedPlaying(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePlayClick();
      }
    },
    [handlePlayClick],
  );

  const youtubeEmbedUrl = useMemo(
    () => (videoUrl ? getYouTubeEmbedUrl(videoUrl) : null),
    [videoUrl],
  );
  const useYouTubeEmbed = Boolean(youtubeEmbedUrl);

  if (!videoUrl?.trim()) {
    return (
      <div
        className={cn(
          "aspect-video w-full rounded-md bg-muted flex items-center justify-center",
          className,
        )}
        role="img"
        aria-label={title}
      >
        <span className="text-sm text-muted-foreground">No video URL</span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-md", className)}
      style={{ aspectRatio: "16/9" }}
    >
      {/* Thumbnail + overlay (hidden after play started) */}
      {!hasStartedPlaying && (
        <button
          type="button"
          onClick={handlePlayClick}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label={`Play video: ${title}`}
          tabIndex={0}
        >
          <div className="absolute inset-0 bg-black/40 z-[1]" aria-hidden />
          {/* Skeleton until thumbnail loads (when using real image URL) */}
          {!thumbnailLoaded && !isPlaceholder && !thumbnailError && (
            <div
              className="absolute inset-0 animate-pulse bg-muted z-0"
              aria-hidden
            />
          )}
          {showThumbnailImage && (
            <img
              src={effectiveThumbnail}
              alt=""
              role="presentation"
              className="absolute inset-0 w-full h-full object-cover z-0"
              loading="lazy"
              onLoad={handleThumbnailLoad}
              onError={handleThumbnailError}
            />
          )}
          {(!showThumbnailImage || isPlaceholder || thumbnailError) && (
            <div
              className="absolute inset-0 bg-muted z-0"
              aria-hidden
            />
          )}
          <span className="relative z-[2] flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 text-primary shadow-lg transition hover:bg-white hover:scale-105">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-current" />
          </span>
        </button>
      )}

      {/* Video player (shown after click) */}
      {hasStartedPlaying && (
        <div className="absolute inset-0 w-full h-full bg-black rounded-md">
          {useYouTubeEmbed && youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              title={title}
              className="absolute inset-0 w-full h-full rounded-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-contain rounded-md"
              controls
              autoPlay
              playsInline
              title={title}
            />
          )}
        </div>
      )}
    </div>
  );
}
