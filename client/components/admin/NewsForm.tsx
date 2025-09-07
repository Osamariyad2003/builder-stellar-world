import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { NewsItem } from "@shared/types";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Pin,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import { useYears } from "@/hooks/useYears";

interface NewsFormProps {
  news?: NewsItem | null;
  onClose: () => void;
  onSave: (news: Partial<NewsItem>) => void;
}

export function NewsForm({ news, onClose, onSave }: NewsFormProps) {
  const { years } = useYears();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    videoUrl: "",
    tags: [] as string[],
    isPinned: false,
    attachments: [] as string[],
    yearId: "",
    subjectId: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title || "",
        content: news.content || "",
        imageUrl: news.imageUrl || "",
        videoUrl: news.videoUrl || "",
        tags: news.tags || [],
        isPinned: news.isPinned || false,
        attachments: news.attachments || [],
        yearId: news.yearId || "",
      });
    }
  }, [news]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newsData: Partial<NewsItem> = {
        ...formData,
        yearNumber: undefined,
        updatedAt: new Date(),
        ...(news
          ? {}
          : {
              createdAt: new Date(),
              authorName: "Current User", // Replace with actual user
              authorId: "current-user-id",
              viewsCount: 0,
            }),
      };

      // if yearId selected, also include yearNumber for convenience
      if (formData.yearId) {
        const selectedYear = years.find((y) => y.id === formData.yearId);
        if (selectedYear) newsData.yearNumber = selectedYear.yearNumber;
      }

      onSave(newsData);
    } catch (error) {
      console.error("Error saving news:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {news ? "Edit Article" : "Create Article"}
            </h1>
            <p className="text-muted-foreground">
              {news
                ? "Update the news article details"
                : "Create a new news article for medical students"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="pinned"
              checked={formData.isPinned}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPinned: checked }))
              }
            />
            <Label htmlFor="pinned" className="flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pin Article
            </Label>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
                <CardDescription>
                  Main article information and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter article title..."
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
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your article content here..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    rows={12}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add relevant tags to help categorize this article
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>
                  Add images and videos to your article
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Featured Image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        videoUrl: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearId">Related Year</Label>
                  <select
                    id="yearId"
                    value={formData.yearId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, yearId: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Not related to a specific year --</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>Year {y.yearNumber}</option>
                    ))}
                  </select>
                </div>

                {formData.imageUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading
                    ? "Saving..."
                    : news
                      ? "Update Article"
                      : "Create Article"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
