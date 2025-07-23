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
import {
  ArrowLeft,
  Save,
  BookOpen,
  GraduationCap,
  Stethoscope,
} from "lucide-react";

interface SubjectFormProps {
  year?: number | null;
  yearType?: "basic" | "clinical";
  onClose: () => void;
  onSave: (subject: any) => void;
}

export function SubjectForm({
  year,
  yearType,
  onClose,
  onSave,
}: SubjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subjectData = {
        name: formData.name,
        imageUrl: formData.imageUrl || "",
        semester: semester || "1st",
      };

      onSave(subjectData);
    } catch (error) {
      console.error("Error saving subject:", error);
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
            <h1 className="text-2xl font-bold">Add Subject to Year {year}</h1>
            <div className="flex items-center gap-2 mt-1">
              {yearType === "basic" ? (
                <GraduationCap className="h-4 w-4 text-blue-600" />
              ) : (
                <Stethoscope className="h-4 w-4 text-red-600" />
              )}
              <p className="text-muted-foreground">
                Adding to {yearType === "basic" ? "Basic" : "Clinical"} Years •
                Year {year} • {semester === "1st" ? "1st Semester" : semester === "2nd" ? "2nd Semester" : "Summer Semester"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Year Selection Display */}
        <Card
          className={`border-l-4 ${yearType === "basic" ? "border-l-blue-500 bg-blue-50/50" : "border-l-red-500 bg-red-50/50"}`}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {yearType === "basic" ? (
                <GraduationCap className="h-8 w-8 text-blue-600" />
              ) : (
                <Stethoscope className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h3 className="font-semibold text-lg">Year {year}</h3>
                <p className="text-sm text-muted-foreground">
                  {yearType === "basic" ? "Basic Years" : "Clinical Years"} • {semester === "1st" ? "1st Semester" : semester === "2nd" ? "2nd Semester" : "Summer Semester"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {yearType === "basic" ? (
                <GraduationCap className="h-5 w-5 text-blue-600" />
              ) : (
                <Stethoscope className="h-5 w-5 text-red-600" />
              )}
              Subject Information
            </CardTitle>
            <CardDescription>
              Basic information about the subject
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={`Year ${year} (${yearType === "basic" ? "Basic" : "Clinical"})`}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Anatomy & Physiology"
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
                How the subject will appear in Year {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt={formData.name}
                      className="w-8 h-8 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <BookOpen className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="font-semibold text-lg">{formData.name}</h3>
                </div>
                <div className="text-xs text-muted-foreground">
                  Year {year} • {yearType} years
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
            {loading ? "Adding..." : "Add Subject"}
          </Button>
        </div>
      </form>
    </div>
  );
}
