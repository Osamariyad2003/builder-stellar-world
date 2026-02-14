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
import { Research, BilingualText } from "@shared/types";

interface ResearchFormProps {
  research?: Research | null;
  onClose: () => void;
  onSave: (data: Partial<Research>) => void;
}

export function ResearchForm({ research, onClose, onSave }: ResearchFormProps) {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [formData, setFormData] = useState({
    projectTitle: { en: "", ar: "" } as BilingualText,
    abstract: { en: "", ar: "" } as BilingualText,
    fieldOfResearch: { en: [] as string[], ar: [] as string[] },
    contactPerson: [] as string[],
    authorshipPosition: { en: [] as string[], ar: [] as string[] },
    projectDuration: { en: "", ar: "" } as BilingualText,
    requiredSkills: { en: [] as string[], ar: [] as string[] },
    supervisor: { en: "", ar: "" } as BilingualText,
  });
  const [tagInput, setTagInput] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (research) {
      setFormData({
        projectTitle: research.projectTitle || { en: "", ar: "" },
        abstract: research.abstract || { en: "", ar: "" },
        fieldOfResearch: research.fieldOfResearch || { en: [], ar: [] },
        contactPerson: research.contactPerson || [],
        authorshipPosition: research.authorshipPosition || { en: [], ar: [] },
        projectDuration: research.projectDuration || { en: "", ar: "" },
        requiredSkills: research.requiredSkills || { en: [], ar: [] },
        supervisor: research.supervisor || { en: "", ar: "" },
      });
    }
  }, [research]);

  const addFieldTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    if (!formData.fieldOfResearch[language].includes(val)) {
      setFormData((prev) => ({
        ...prev,
        fieldOfResearch: {
          ...prev.fieldOfResearch,
          [language]: [...prev.fieldOfResearch[language], val],
        },
      }));
    }
    setTagInput("");
  };

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    if (!formData.requiredSkills[language].includes(val)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: {
          ...prev.requiredSkills,
          [language]: [...prev.requiredSkills[language], val],
        },
      }));
    }
    setSkillInput("");
  };

  const removeField = (t: string, lang: "en" | "ar") =>
    setFormData((prev) => ({
      ...prev,
      fieldOfResearch: {
        ...prev.fieldOfResearch,
        [lang]: prev.fieldOfResearch[lang].filter((f) => f !== t),
      },
    }));

  const removeSkill = (s: string, lang: "en" | "ar") =>
    setFormData((prev) => ({
      ...prev,
      requiredSkills: {
        ...prev.requiredSkills,
        [lang]: prev.requiredSkills[lang].filter((f) => f !== s),
      },
    }));

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
        <div className="flex gap-2">
          <Button
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
            className="w-20"
          >
            English
          </Button>
          <Button
            variant={language === "ar" ? "default" : "outline"}
            onClick={() => setLanguage("ar")}
            className="w-20"
          >
            العربية
          </Button>
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
                  <Label htmlFor="title">
                    Project Title {language === "en" ? "(English)" : "(العربية)"} *
                  </Label>
                  <Input
                    id="title"
                    placeholder={language === "en" ? "Enter project title..." : "أدخل عنوان المشروع..."}
                    value={formData.projectTitle[language]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectTitle: { ...prev.projectTitle, [language]: e.target.value },
                      }))
                    }
                    required
                    dir={language === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abstract">
                    Abstract {language === "en" ? "(English)" : "(العربية)"}
                  </Label>
                  <Textarea
                    id="abstract"
                    placeholder={language === "en" ? "Write a brief abstract..." : "اكتب ملخصًا موجزًا..."}
                    value={formData.abstract[language]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        abstract: { ...prev.abstract, [language]: e.target.value },
                      }))
                    }
                    rows={8}
                    dir={language === "ar" ? "rtl" : "ltr"}
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
                  <Label>Field of Research {language === "en" ? "(English)" : "(العربية)"}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder={language === "en" ? "Add field e.g., Oncology" : "أضف حقل مثل علم الأورام"}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFieldTag();
                        }
                      }}
                      dir={language === "ar" ? "rtl" : "ltr"}
                    />
                    <Button type="button" onClick={addFieldTag} variant="outline">
                      {language === "en" ? "Add" : "إضافة"}
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {formData.fieldOfResearch[language].map((f) => (
                      <Badge key={f} variant="secondary" className="flex items-center gap-2">
                        {f}
                        <button type="button" onClick={() => removeField(f, language)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Required Skills {language === "en" ? "(English)" : "(العربية)"}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder={language === "en" ? "Add skill e.g., Data analysis" : "أضف مهارة مثل تحليل البيانات"}
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      dir={language === "ar" ? "rtl" : "ltr"}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      {language === "en" ? "Add" : "إضافة"}
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {formData.requiredSkills[language].map((s) => (
                      <Badge key={s} variant="secondary" className="flex items-center gap-2">
                        {s}
                        <button type="button" onClick={() => removeSkill(s, language)} className="ml-1 hover:text-destructive">
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
                  <Input
                    placeholder="Comma separated names"
                    value={formData.contactPerson.join(", ")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactPerson: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Authorship Positions {language === "en" ? "(English)" : "(العربية)"}</Label>
                  <Input
                    placeholder={language === "en" ? "Comma separated positions" : "المواضع مفصولة بفاصلات"}
                    value={formData.authorshipPosition[language].join(", ")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        authorshipPosition: {
                          ...prev.authorshipPosition,
                          [language]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        },
                      }))
                    }
                    dir={language === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supervisor {language === "en" ? "(English)" : "(العربية)"}</Label>
                  <Input
                    placeholder={language === "en" ? "Supervisor name" : "اسم المشرف"}
                    value={formData.supervisor[language]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supervisor: { ...prev.supervisor, [language]: e.target.value },
                      }))
                    }
                    dir={language === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project Duration {language === "en" ? "(English)" : "(العربية)"}</Label>
                  <Input
                    placeholder={language === "en" ? "e.g., 6 months" : "مثال: 6 أشهر"}
                    value={formData.projectDuration[language]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectDuration: { ...prev.projectDuration, [language]: e.target.value },
                      }))
                    }
                    dir={language === "ar" ? "rtl" : "ltr"}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={onClose}>
                    {language === "en" ? "Cancel" : "إلغاء"}
                  </Button>
                  <Button type="submit">
                    {language === "en" ? "Save" : "حفظ"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
