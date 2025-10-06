import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft } from "lucide-react";
import { Research } from "@shared/types";

interface ResearchFormProps {
  research?: Research | null;
  onClose: () => void;
  onSave: (data: Partial<Research>) => void;
}

export function ResearchForm({ research, onClose, onSave }: ResearchFormProps) {
  const [formData, setFormData] = useState({
    projectTitle: "",
    abstract: "",
    fieldOfResearch: [] as string[],
    contactPerson: [] as string[],
    authorshipPosition: [] as string[],
    projectDuration: "",
    requiredSkills: [] as string[],
    supervisor: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (research) {
      setFormData({
        projectTitle: research.projectTitle || "",
        abstract: research.abstract || "",
        fieldOfResearch: research.fieldOfResearch || [],
        contactPerson: research.contactPerson || [],
        authorshipPosition: research.authorshipPosition || [],
        projectDuration: research.projectDuration || "",
        requiredSkills: research.requiredSkills || [],
        supervisor: research.supervisor || "",
      });
    }
  }, [research]);

  const addFieldTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    if (!formData.fieldOfResearch.includes(val)) {
      setFormData((prev) => ({ ...prev, fieldOfResearch: [...prev.fieldOfResearch, val] }));
    }
    setTagInput("");
  };

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    if (!formData.requiredSkills.includes(val)) {
      setFormData((prev) => ({ ...prev, requiredSkills: [...prev.requiredSkills, val] }));
    }
    setSkillInput("");
  };

  const removeField = (t: string) => setFormData((prev) => ({ ...prev, fieldOfResearch: prev.fieldOfResearch.filter((f) => f !== t) }));
  const removeSkill = (s: string) => setFormData((prev) => ({ ...prev, requiredSkills: prev.requiredSkills.filter((f) => f !== s) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Research> = {
      projectTitle: formData.projectTitle,
      abstract: formData.abstract,
      fieldOfResearch: formData.fieldOfResearch,
      contactPerson: formData.contactPerson,
      authorshipPosition: formData.authorshipPosition,
      projectDuration: formData.projectDuration,
      requiredSkills: formData.requiredSkills,
      supervisor: formData.supervisor,
      updatedAt: new Date(),
      ...(research ? {} : { createdAt: new Date() }),
    };

    onSave(payload);
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
            <h1 className="text-2xl font-bold">{research ? "Edit Research" : "Create Research"}</h1>
            <p className="text-muted-foreground">Add or update research project details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Title and abstract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter project title..."
                    value={formData.projectTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, projectTitle: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abstract">Abstract</Label>
                  <Textarea
                    id="abstract"
                    placeholder="Write a brief abstract..."
                    value={formData.abstract}
                    onChange={(e) => setFormData((prev) => ({ ...prev, abstract: e.target.value }))}
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fields & Skills</CardTitle>
                <CardDescription>Fields of research and required skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Field of Research</Label>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Add field e.g., Oncology" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFieldTag(); } }} />
                    <Button type="button" onClick={addFieldTag} variant="outline">Add</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {formData.fieldOfResearch.map((f) => (
                      <Badge key={f} variant="secondary" className="flex items-center gap-2">
                        {f}
                        <button type="button" onClick={() => removeField(f)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Required Skills</Label>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Add skill e.g., Data analysis" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                    <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {formData.requiredSkills.map((s) => (
                      <Badge key={s} variant="secondary" className="flex items-center gap-2">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meta</CardTitle>
                <CardDescription>Contact, supervisor and duration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contact Person(s)</Label>
                  <Input placeholder="Comma separated names" value={formData.contactPerson.join(", ")} onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} />
                </div>

                <div className="space-y-2">
                  <Label>Authorship Positions</Label>
                  <Input placeholder="Comma separated positions" value={formData.authorshipPosition.join(", ")} onChange={(e) => setFormData((prev) => ({ ...prev, authorshipPosition: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} />
                </div>

                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <Input placeholder="Supervisor name" value={formData.supervisor} onChange={(e) => setFormData((prev) => ({ ...prev, supervisor: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Project Duration</Label>
                  <Input placeholder="e.g., 6 months" value={formData.projectDuration} onChange={(e) => setFormData((prev) => ({ ...prev, projectDuration: e.target.value }))} />
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
