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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  FileText,
  Upload,
  Link as LinkIcon,
} from "lucide-react";

interface FileFormProps {
  file?: any;
  lectureId?: string | null;
  onClose: () => void;
  onSave: (file: any) => void;
}

export function FileForm({ file, lectureId, onClose, onSave }: FileFormProps) {
  const [formData, setFormData] = useState({
    title: file?.title || "",
    description: file?.description || "",
    fileUrl: file?.fileUrl || file?.url || "",
    imageUrl: file?.imageUrl || file?.thumbnailUrl || "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fileData = {
        ...formData,
        id: `file_${Date.now()}`,
        lectureId: lectureId,
        uploadedAt: new Date(),
        uploadedBy: "Current User",
      };

      onSave(fileData);
    } catch (error) {
      console.error("Error saving file:", error);
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
            <h1 className="text-2xl font-bold">Add File</h1>
            <p className="text-muted-foreground">
              Add a file resource to the lecture
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              File Information
            </CardTitle>
            <CardDescription>
              Upload or link to educational files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">File Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Anatomy Reference Guide"
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
                placeholder="Describe the file content..."
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
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                placeholder="https://example.com/file.pdf or /uploads/file.pdf"
                value={formData.fileUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fileUrl: e.target.value,
                  }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                You can upload to Firebase Storage or use external links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Preview Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/preview.jpg"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    imageUrl: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add a preview/thumbnail image for the file
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.title && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How the file will appear in the lecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt={formData.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-blue-100 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{formData.title}</h4>
                    {formData.description && (
                      <p className="text-sm text-muted-foreground">
                        {formData.description}
                      </p>
                    )}
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
            {loading ? "Adding..." : "Add File"}
          </Button>
        </div>
      </form>
    </div>
  );
}
