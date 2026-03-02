import React, { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MapVideoWithThumbnailProps {
  id?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  location?: string;
  posterUrl?: string;
  onPlay?: () => void;
  className?: string;
}

/**
 * MapVideoWithThumbnail Component
 * 
 * Displays a video with thumbnail preview before playback.
 * Shows a play icon overlay that hides when clicked and autoplays video.
 * 
 * Features:
 * - 16:9 aspect ratio
 * - Loading skeleton
 * - Play icon overlay
 * - Responsive design
 * - Lazy loading
 * - Fallback to poster attribute
 */
export function MapVideoWithThumbnail({
  id,
  videoUrl,
  thumbnailUrl,
  title,
  location,
  posterUrl,
  onPlay,
  className = "",
}: MapVideoWithThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Extract video ID from YouTube URL for thumbnail
  const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    let videoId = "";
    
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      }
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    
    return null;
  };

  // Determine which thumbnail to use
  const effectiveThumbnail =
    thumbnailUrl || getYoutubeThumbnail(videoUrl) || posterUrl;

  const handleThumbnailClick = () => {
    setShowThumbnail(false);
    setIsPlaying(true);
    onPlay?.();

    // Auto-play if it's a video element
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
  };

  const handleThumbnailError = () => {
    // Fallback: if thumbnail fails to load, still allow playing
    setThumbnailLoaded(true);
  };

  return (
    <div className={`relative w-full bg-gray-900 rounded-lg overflow-hidden group ${className}`}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          controls={isPlaying}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            showThumbnail ? "opacity-0" : "opacity-100"
          }`}
          style={{ pointerEvents: showThumbnail ? "none" : "auto" }}
        />

        {/* Thumbnail with Play Overlay */}
        {showThumbnail && (
          <>
            {/* Loading Skeleton */}
            {!thumbnailLoaded && (
              <div className="absolute inset-0 w-full h-full bg-gray-800">
                <Skeleton className="w-full h-full rounded-none" />
              </div>
            )}

            {/* Thumbnail Image */}
            {effectiveThumbnail ? (
              <img
                src={effectiveThumbnail}
                alt={title || "Video thumbnail"}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                  thumbnailLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleThumbnailLoad}
                onError={handleThumbnailError}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <Play className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-200" />

            {/* Play Button */}
            <button
              onClick={handleThumbnailClick}
              className="absolute inset-0 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95"
              aria-label={`Play ${title || "video"}`}
            >
              <div className="bg-white/90 hover:bg-white rounded-full p-4 shadow-lg transition-all">
                <Play className="h-8 w-8 fill-blue-600 text-blue-600" />
              </div>
            </button>

            {/* Info Overlay (bottom) */}
            {(title || location) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                {title && (
                  <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
                )}
                {location && (
                  <p className="text-xs text-gray-300 line-clamp-1 mt-1">
                    {location}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
