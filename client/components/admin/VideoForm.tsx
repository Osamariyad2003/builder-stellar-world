import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  PlayCircle,
  Video,
  Link as LinkIcon,
  Clock,
} from "lucide-react";

interface VideoFormProps {
  lectureId?: string | null;
  onClose: () => void;
  onSave: (video: any) => void;
}

export function VideoForm({ lectureId, onClose, onSave }: VideoFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    duration: "",
    thumbnailUrl: "",
    platform: "YouTube",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const videoData = {
        ...formData,
        id: `video_${Date.now()}`,
        lectureId: lectureId,
        uploadedAt: new Date(),
        uploadedBy: "Current User",
      };

      onSave(videoData);
    } catch (error) {
      console.error("Error saving video:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    );
    return match ? match[1] : null;
  };

  const generateThumbnail = (url: string) => {
    const videoId = extractYouTubeId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : "";
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      url: url,
      thumbnailUrl: generateThumbnail(url),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Video</h1>
            <p className="text-muted-foreground">
              Add a video resource to the lecture
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-green-600" />
              Video Information
            </CardTitle>
            <CardDescription>
              Add YouTube videos or other video links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Human Anatomy"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the video content..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Video URL *</Label>
              <Input
                id="url"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={formData.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Supports YouTube, Vimeo, and direct video links
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 45:30"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      platform: e.target.value,
                    }))
                  }
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                placeholder="Auto-generated for YouTube videos"
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thumbnailUrl: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.title && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How the video will appear in the lecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <div className="flex gap-3">
                  <div className="relative">
                    {formData.thumbnailUrl ? (
                      <img
                        src={formData.thumbnailUrl}
                        alt={formData.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <Video className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white opacity-80" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{formData.title}</h4>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {formData.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {formData.duration && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formData.duration}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {formData.platform}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Adding..." : "Add Video"}
          </Button>
        </div>
      </form>
    </div>
  );
}
