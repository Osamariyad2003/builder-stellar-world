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
import {
  ArrowLeft,
  Save,
  BookOpen,
  GraduationCap,
  Stethoscope,
  Upload,
  Loader2,
} from "lucide-react";
import {
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";

interface Lecture {
  id?: string;
  name: string;
  description?: string;
  order?: number;
  imageUrl?: string;
}

interface LectureFormProps {
  lecture?: Lecture | null;
  subjectId?: string | null;
  subjectName?: string;
  yearType?: "basic" | "clinical";
  onClose: () => void;
  onSave: (lecture: any) => void;
}

export function LectureForm({
  lecture,
  subjectId,
  subjectName,
  yearType,
  onClose,
  onSave,
}: LectureFormProps) {
  const isEditing = !!lecture?.id;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: 1,
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (lecture) {
      setFormData({
        name: lecture.name || "",
        description: lecture.description || "",
        order: lecture.order || 1,
        imageUrl: lecture.imageUrl || "",
      });
    }
  }, [lecture]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      let imageUrl: string | null = null;

      // Try Cloudinary first
      try {
        imageUrl = await uploadImageToCloudinary(file);
      } catch (cloudErr: any) {
        console.warn(
          "Cloudinary upload failed, trying ImageKit",
          cloudErr?.message || cloudErr,
        );

        // Fallback to ImageKit
        imageUrl = await uploadToImageKitServer(file, file.name);
      }

      if (!imageUrl) {
        alert("Failed to upload image");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        imageUrl,
      }));

      alert("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lectureData = {
        ...formData,
        subjectId: subjectId,
        ...(isEditing && lecture ? { id: lecture.id } : { createdAt: new Date(), uploadedBy: "Current User" }),
      };

      onSave(lectureData);
    } catch (error) {
      console.error("Error saving lecture:", error);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Lecture" : "Add Lecture"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? `Editing "${lecture?.name}" in ${subjectName}`
                : `Add a new lecture to ${subjectName}`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {yearType === "basic" ? (
                <GraduationCap className="h-5 w-5 text-blue-600" />
              ) : (
                <Stethoscope className="h-5 w-5 text-red-600" />
              )}
              Lecture Information
            </CardTitle>
            <CardDescription>
              Basic information about the lecture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Lecture Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Introduction to Cell Biology"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this lecture covers..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.name && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How the lecture will appear in {subjectName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-secondary/20">
                <div className="flex items-start gap-3">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt={formData.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{formData.name}</h3>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground">
                        {formData.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Lecture {formData.order} • {subjectName}
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
            {loading
              ? isEditing
                ? "Saving..."
                : "Adding..."
              : isEditing
                ? "Save Changes"
                : "Add Lecture"}
          </Button>
        </div>
      </form>
    </div>
  );
}
