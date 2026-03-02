import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, Trash2, Edit2, X } from "lucide-react";
import { ResearchForm } from "@/components/admin/ResearchForm";
import { useResearch } from "@/hooks/useResearch";
import { ResearchContactMethods } from "@/components/student/ResearchContactMethods";

export default function Research() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [displayLanguage, setDisplayLanguage] = useState<"en" | "ar">("en");

  const { research, loading, error, createResearch, updateResearch, deleteResearch } = useResearch();

  const filtered = research.filter((r) =>
    typeof r.projectTitle === "string"
      ? r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
      : r.projectTitle[displayLanguage]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelected(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this research entry?")) {
      await deleteResearch(id);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm("This will add 8 sample research projects. Continue?")) {
      return;
    }

    const sampleResearch = [
      {
        projectTitle: { en: "Antibiotic Resistance Patterns in Local Hospitals", ar: "أنماط مقاومة المضادات الحيوية في المستشفيات المحلية" },
        abstract: { en: "A comprehensive study examining the prevalence and mechanisms of antibiotic resistance in bacterial pathogens isolated from three major hospitals in the region over a 12-month period.", ar: "دراسة شاملة تفحص انتشار آليات مقاومة المضادات الحيوية في مسببات الأمراض البكتيرية المعزولة من ثلاث مستشفيات كبرى في المنطقة على مدى فترة 12 شهرًا." },
        fieldOfResearch: { en: ["Microbiology", "Infectious Diseases", "Public Health"], ar: ["علم الأحياء الدقيقة", "الأمراض المعدية", "الصحة العامة"] },
        contactPerson: ["Dr. Emily Rodriguez"],
        authorshipPosition: { en: ["Lead Researcher"], ar: ["الباحث الرئيسي"] },
        projectDuration: { en: "12 months", ar: "12 شهرًا" },
        requiredSkills: { en: ["Bacterial isolation and identification", "Antibiotic susceptibility testing", "Data analysis"], ar: ["عزل وتحديد البكتيريا", "اختبار حساسية المضادات الحيوية", "تحليل البيانات"] },
        supervisor: { en: "Prof. James Mitchell", ar: "أ.د. جيمس ميتشل" }
      },
      {
        projectTitle: { en: "Impact of Sleep Deprivation on Cognitive Performance in Medical Students", ar: "تأثير حرمان النوم على الأداء المعرفي لطلاب الطب" },
        abstract: { en: "An observational study investigating the correlation between sleep patterns and academic performance, focusing on memory retention and clinical reasoning abilities.", ar: "دراسة مراقبة تبحث العلاقة بين أنماط النوم والأداء الأكاديمي، مع التركيز على الاحتفاظ بالذاكرة وقدرات التفكير السريري." },
        fieldOfResearch: { en: ["Medical Education", "Sleep Medicine", "Neuroscience"], ar: ["التعليم الطبي", "طب النوم", "علم الأعصاب"] },
        contactPerson: ["Dr. Sarah Johnson", "Dr. Michael Chen"],
        authorshipPosition: { en: ["Co-lead", "Data Manager"], ar: ["قائد مشارك", "مدير البيانات"] },
        projectDuration: { en: "8 months", ar: "8 أشهر" },
        requiredSkills: { en: ["Statistical analysis", "Sleep assessment tools", "Psychological testing"], ar: ["التحليل الإحصائي", "أدوات تقييم النوم", "الاختبارات النفسية"] },
        supervisor: { en: "Prof. Linda Patterson", ar: "أ.د. ليندا باترسون" }
      },
      {
        projectTitle: { en: "Effectiveness of Virtual Reality in Surgical Training", ar: "فعالية الواقع الافتراضي في التدريب الجراحي" },
        abstract: { en: "A randomized controlled trial comparing traditional surgical training methods with VR-based simulation techniques in teaching laparoscopic procedures.", ar: "تجربة عشوائية محكومة تقارن طرق التدريب الجراحي التقليدية مع تقنيات المحاكاة القائمة على الواقع الافتراضي في تعليم إجراءات تنظير البطن." },
        fieldOfResearch: { en: ["Surgery", "Medical Education", "Technology"], ar: ["الجراحة", "التعليم الطبي", "التكنولوجيا"] },
        contactPerson: ["Dr. Robert Williams"],
        authorshipPosition: { en: ["Principal Investigator"], ar: ["الباحث الرئيسي"] },
        projectDuration: { en: "18 months", ar: "18 شهرًا" },
        requiredSkills: { en: ["Surgical expertise", "VR technology", "Educational assessment"], ar: ["الخبرة الجراحية", "تكنولوجيا الواقع الافتراضي", "التقييم التعليمي"] },
        supervisor: { en: "Prof. David Thompson", ar: "أ.د. ديفيد طومسون" }
      },
      {
        projectTitle: { en: "Cardiovascular Biomarkers in Early Diabetes Detection", ar: "المؤشرات الحيوية القلبية في الكشف المبكر عن السكري" },
        abstract: { en: "Investigation of novel biomarkers that can predict cardiovascular complications in newly diagnosed Type 2 diabetes patients with high sensitivity and specificity.", ar: "التحقيق في مؤشرات حيوية جديدة يمكنها التنبؤ بمضاعفات القلب والأوعية الدموية لدى مرضى السكري من النوع الثاني المشخصين حديثًا بحساسية وخصوصية عالية." },
        fieldOfResearch: { en: ["Cardiology", "Endocrinology", "Biomarker Research"], ar: ["أمراض القلب", "الغدد الصماء", "أبحاث المؤشرات الحيوية"] },
        contactPerson: ["Dr. Priya Sharma"],
        authorshipPosition: { en: ["Lead Researcher"], ar: ["الباحث الرئيسي"] },
        projectDuration: { en: "14 months", ar: "14 شهرًا" },
        requiredSkills: { en: ["Molecular biology", "Biostatistics", "Laboratory techniques"], ar: ["علم الأحياء الجزيئية", "الإحصائيات الحيوية", "تقنيات المختبر"] },
        supervisor: { en: "Prof. Rajesh Kumar", ar: "أ.د. راجيش كومار" }
      },
      {
        projectTitle: { en: "Mental Health Outcomes in Cancer Patients: A Longitudinal Study", ar: "نتائج الصحة العقلية لدى مرضى السرطان: دراسة طولية" },
        abstract: { en: "A long-term prospective study examining psychological adjustment, quality of life, and mental health disorders in patients undergoing cancer treatment.", ar: "دراسة استشرافية طويلة الأجل تفحص التكيف النفسي وجودة الحياة واضطرابات الصحة العقلية لدى المرضى الذين يخضعون للعلاج من السرطان." },
        fieldOfResearch: { en: ["Oncology", "Psychiatry", "Clinical Psychology"], ar: ["علم الأورام", "الطب النفسي", "علم النفس السريري"] },
        contactPerson: ["Dr. Margaret Stewart"],
        authorshipPosition: { en: ["Principal Investigator"], ar: ["الباحث الرئيسي"] },
        projectDuration: { en: "24 months", ar: "24 شهرًا" },
        requiredSkills: { en: ["Psychological assessment", "Patient counseling", "Longitudinal data analysis"], ar: ["التقييم النفسي", "استشارة المرضى", "تحليل البيانات الطولية"] },
        supervisor: { en: "Prof. Helen Martinez", ar: "أ.د. هيلين مارتينيز" }
      },
      {
        projectTitle: { en: "Pharmacogenomics and Drug Response Variability in Hypertension Management", ar: "علم الصيدلة الجينومي وتباين استجابة العقاقير في إدارة ارتفاع ضغط الدم" },
        abstract: { en: "Exploring genetic variations that influence antihypertensive drug efficacy and adverse effects to enable personalized medication selection for better patient outcomes.", ar: "استكشاف الاختلافات الجينية التي تؤثر على فعالية الأدوية المضادة لارتفاع ضغط الدم والآثار الضائرة لتمكين اختيار الأدوية الشخصية لتحسين نتائج المرضى." },
        fieldOfResearch: { en: ["Pharmacology", "Genetics", "Cardiovascular Medicine"], ar: ["الصيدلة", "علم الوراثة", "طب القلب والأوعية الدموية"] },
        contactPerson: ["Dr. Aditya Patel"],
        authorshipPosition: { en: ["Lead Researcher"], ar: ["الباحث الرئيسي"] },
        projectDuration: { en: "10 months", ar: "10 أشهر" },
        requiredSkills: { en: ["Genetic sequencing", "Pharmacokinetics", "Clinical trial management"], ar: ["تسلسل الجينات", "حركة الدواء في الجسم", "إدارة التجارب السريرية"] },
        supervisor: { en: "Prof. Sunita Desai", ar: "أ.د. سونيتا ديساي" }
      },
      {
        projectTitle: { en: "Environmental Factors and Asthma Exacerbation Rates", ar: "العوامل البيئية ومعدلات تفاقم الربو" },
        abstract: { en: "An epidemiological investigation of air quality, allergen levels, and climatic factors as predictors of asthma hospitalizations in urban populations.", ar: "تحقيق وبائي عن جودة الهواء ومستويات مسببات الحساسية والعوامل المناخية كمنبئات بدخول مستشفيات الربو في السكان الحضر." },
        fieldOfResearch: { en: ["Pulmonology", "Environmental Health", "Epidemiology"], ar: ["طب الرئة", "الصحة البيئية", "علم الأوبئة"] },
        contactPerson: ["Dr. Thomas Anderson"],
        authorshipPosition: { en: ["Co-lead"], ar: ["قائد مشارك"] },
        projectDuration: { en: "12 months", ar: "12 شهرًا" },
        requiredSkills: { en: ["Environmental sampling", "Epidemiological modeling", "Respiratory assessment"], ar: ["أخذ عينات بيئية", "النمذجة الوبائية", "تقييم التنفس"] },
        supervisor: { en: "Prof. Jennifer Garcia", ar: "أ.د. جنيفر جارسيا" }
      },
      {
        projectTitle: { en: "Telehealth Efficacy in Rural Community Care: A Multicenter Trial", ar: "فعالية الصحة الإلكترونية في الرعاية المجتمعية الريفية: تجربة متعددة المراكز" },
        abstract: { en: "Evaluating the effectiveness of telemedicine interventions in providing specialized medical care to underserved rural areas and measuring patient satisfaction and health outcomes.", ar: "تقييم فعالية التدخلات الطبية عن بعد في توفير الرعاية الطبية المتخصصة للمناطق الريفية المحرومة من الخدمات وقياس رضا المرضى والنتائج الصحية." },
        fieldOfResearch: { en: ["Healthcare Technology", "Public Health", "Rural Medicine"], ar: ["تكنولوجيا الرعاية الصحية", "الصحة العامة", "الطب الريفي"] },
        contactPerson: ["Dr. Christopher Lee"],
        authorshipPosition: { en: ["Principal Investigator"], ar: ["الباحث الرئيسي"] },
        projectDuration: { en: "15 months", ar: "15 شهرًا" },
        requiredSkills: { en: ["Telehealth platform management", "Outcome measurement", "Community health assessment"], ar: ["إدارة منصة الصحة الإلكترونية", "قياس النتائج", "تقييم صحة المجتمع"] },
        supervisor: { en: "Prof. Victoria Wong", ar: "أ.د. فيكتوريا وونج" }
      }
    ];

    try {
      for (let i = 0; i < sampleResearch.length; i++) {
        await createResearch({
          ...sampleResearch[i],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      alert("✅ Successfully added 8 sample research projects!");
    } catch (err) {
      console.error("Error seeding research data:", err);
      alert("Failed to seed data. Please try again.");
    }
  };

  if (isFormOpen) {
    return (
      <ResearchForm
        research={selected}
        onClose={() => {
          setIsFormOpen(false);
          setSelected(null);
        }}
        onSave={async (data) => {
          try {
            if (selected) {
              await updateResearch(selected.id, data);
            } else {
              await createResearch(data as any);
            }
            setIsFormOpen(false);
            setSelected(null);
          } catch (err) {
            console.error(err);
            alert("Failed to save. Please try again.");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Research</h1>
          <p className="text-muted-foreground">Manage research projects and student/faculty submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 border rounded-lg p-1">
            <Button
              variant={displayLanguage === "en" ? "default" : "ghost"}
              onClick={() => setDisplayLanguage("en")}
              className="h-8 w-16 text-sm"
            >
              English
            </Button>
            <Button
              variant={displayLanguage === "ar" ? "default" : "ghost"}
              onClick={() => setDisplayLanguage("ar")}
              className="h-8 w-16 text-sm"
            >
              العربية
            </Button>
          </div>
          <Button onClick={handleSeedData} variant="outline" className="flex items-center gap-2">
            📊 Seed Data
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Research
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={displayLanguage === "en" ? "Search by project title..." : "البحث حسب عنوان المشروع..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              dir={displayLanguage === "ar" ? "rtl" : "ltr"}
            />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading research entries...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive mb-4">⚠️ Error loading research</div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((r) => {
            const title = typeof r.projectTitle === "string" ? r.projectTitle : r.projectTitle[displayLanguage] || r.projectTitle.en;
            const abstract = typeof r.abstract === "string" ? r.abstract : r.abstract?.[displayLanguage] || r.abstract?.en;
            const fields = typeof r.fieldOfResearch === "object" && r.fieldOfResearch !== null && !Array.isArray(r.fieldOfResearch)
              ? r.fieldOfResearch[displayLanguage] || r.fieldOfResearch.en
              : r.fieldOfResearch || [];

            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex gap-4" dir={displayLanguage === "ar" ? "rtl" : "ltr"}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{abstract}</p>
                          <div className="flex gap-2 flex-wrap mt-3 text-xs text-muted-foreground">
                            {(fields || []).map((f: string) => (
                              <span key={f} className="bg-muted px-2 py-1 rounded text-xs">{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 ${displayLanguage === "ar" ? "mr-4" : "ml-4"}`}>
                          <Button variant="ghost" onClick={() => handleEdit(r)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(r.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
