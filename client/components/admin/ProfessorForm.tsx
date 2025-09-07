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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Professor } from "@shared/types";
import {
  ArrowLeft,
  Save,
  Upload,
  User,
  Mail,
  MapPin,
  Building,
} from "lucide-react";

interface ProfessorFormProps {
  professor?: Professor | null;
  onClose: () => void;
  onSave: (professor: Partial<Professor>) => void;
}

export function ProfessorForm({
  professor,
  onClose,
  onSave,
}: ProfessorFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    department: "",
    email: "",
    others: "",
    officeLocation: "",
    researchAreas: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (professor) {
      setFormData({
        name: professor.name || "",
        title: professor.title || "",
        department: professor.department || "",
        email: professor.email || "",
        others: (professor as any).others || "",
        officeLocation: professor.officeLocation || "",
        researchAreas: (professor.researchAreas || []).join(", "),
        website: professor.website || "",
        imageUrl: professor.imageUrl || "",
      });
    }
  }, [professor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const professorData: Partial<Professor> = {
      ...formData,
      researchAreas: formData.researchAreas
        ? formData.researchAreas.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    } as any;

    onSave(professorData);
    } catch (error) {
      console.error("Error saving professor:", error);
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
              {professor ? "Edit Professor" : "Add Professor"}
            </h1>
            <p className="text-muted-foreground">
              {professor
                ? "Update professor information"
                : "Add a new professor to the faculty"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Professor Information
            </CardTitle>
            <CardDescription>
              Basic information about the professor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.imageUrl} alt={formData.name} />
                <AvatarFallback>
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <Label htmlFor="imageUrl">Profile Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/profile.jpg"
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

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Dr. John Smith"
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Associate Professor"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </Label>
                <Input
                  id="department"
                  placeholder="Internal Medicine"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="others">Others</Label>
                <Input
                  id="others"
                  placeholder="Other contact or notes"
                  value={(formData as any).others}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, others: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.smith@university.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="officeLocation"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Office Location
                </Label>
                <Input
                  id="officeLocation"
                  placeholder="Medical Building, Room 301"
                  value={formData.officeLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      officeLocation: e.target.value,
                    }))
                  }
                />
              </div>
            </div>


            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="researchAreas">Research Areas</Label>
                <Input
                  id="researchAreas"
                  placeholder="e.g., Cardiology, Epidemiology"
                  value={formData.researchAreas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, researchAreas: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
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
                How the professor will appear in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={formData.imageUrl} alt={formData.name} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{formData.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.department}
                  </p>
                  <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                    {formData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{formData.email}</span>
                      </div>
                    )}
                    {formData.officeLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{formData.officeLocation}</span>
                      </div>
                    )}
                    {(formData as any).others && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{(formData as any).others}</span>
                      </div>
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
            {loading
              ? "Saving..."
              : professor
                ? "Update Professor"
                : "Add Professor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
