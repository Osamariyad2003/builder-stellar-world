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
    description: "",
    code: "",
    credits: 3,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subjectData = {
        ...formData,
        year: year,
        yearType: yearType,
        id: `subject_${Date.now()}`,
        lectures: [],
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
            <h1 className="text-2xl font-bold">Add Subject</h1>
            <p className="text-muted-foreground">
              Add a new subject to Year {year} ({yearType} years)
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
              Subject Information
            </CardTitle>
            <CardDescription>
              Basic information about the subject
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., ANAT101"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this subject covers..."
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

            <div className="space-y-2">
              <Label htmlFor="credits">Credit Hours</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    credits: parseInt(e.target.value) || 3,
                  }))
                }
              />
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
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{formData.name}</h3>
                  {formData.code && (
                    <span className="text-sm text-muted-foreground">
                      ({formData.code})
                    </span>
                  )}
                </div>
                {formData.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {formData.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  {formData.credits} credit hours • Year {year} • {yearType}{" "}
                  years
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
