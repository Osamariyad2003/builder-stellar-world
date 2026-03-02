import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Play, MapPin } from "lucide-react";

interface MapVideoCardProps {
  id?: string;
  name: string;
  description?: string;
  location?: string;
  type?: string;
  thumbnailUrl?: string;
  video_url?: string;
  onPlayClick?: () => void;
}

export function MapVideoCard({
  name,
  description,
  location,
  type,
  thumbnailUrl,
  video_url,
  onPlayClick,
}: MapVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePlayClick = () => {
    if (video_url) {
      if (onPlayClick) {
        onPlayClick();
      } else {
        // Open video in new tab or modal
        window.open(video_url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const generateThumbnail = (url: string) => {
    // Extract video ID from YouTube URL if applicable
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
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

  const thumbnailSrc = thumbnailUrl || (video_url ? generateThumbnail(video_url) : null);

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300">
      {/* Video Thumbnail Container - 16:9 Aspect Ratio */}
      <div
        className="relative w-full bg-gray-800 overflow-hidden cursor-pointer group"
        style={{ aspectRatio: "16 / 9" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePlayClick}
      >
        {/* Thumbnail Image */}
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Dark Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isHovered ? "opacity-40" : "opacity-20"
          }`}
        />

        {/* Play Button */}
        {video_url && (
          <button
            onClick={handlePlayClick}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 group-active:scale-95 ${
              isHovered ? "opacity-100 scale-100" : "opacity-75 scale-90"
            }`}
            aria-label={`Play video: ${name}`}
          >
            <div className="bg-white/90 hover:bg-white rounded-full p-4 transition-all duration-200">
              <Play className="h-8 w-8 fill-blue-600 text-blue-600" />
            </div>
          </button>
        )}

        {/* Type Badge */}
        {type && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
            {type}
          </div>
        )}
      </div>

      {/* Video Information */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-sm md:text-base line-clamp-2 text-gray-900 mb-2">
          {name}
        </h3>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* CTA */}
        {video_url && (
          <button
            onClick={handlePlayClick}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="h-4 w-4 fill-white" />
            Watch Video
          </button>
        )}
      </div>
    </Card>
  );
}
