import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, Trash2, Edit2 } from "lucide-react";
import { ResearchForm } from "@/components/admin/ResearchForm";
import { useResearch } from "@/hooks/useResearch";

export default function Research() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    research,
    loading,
    error,
    createResearch,
    updateResearch,
    deleteResearch,
  } = useResearch();

  const filtered = research.filter((r) =>
    r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()),
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
    if (
      window.confirm("Are you sure you want to delete this research entry?")
    ) {
      await deleteResearch(id);
    }
  };

  const handleSeedData = async () => {
    if (
      !window.confirm("This will add 8 sample research projects. Continue?")
    ) {
      return;
    }

    const sampleResearch = [
      {
        projectTitle: "Antibiotic Resistance Patterns in Local Hospitals",
        abstract:
          "A comprehensive study examining the prevalence and mechanisms of antibiotic resistance in bacterial pathogens isolated from three major hospitals in the region over a 12-month period.",
        fieldOfResearch: [
          "Microbiology",
          "Infectious Diseases",
          "Public Health",
        ],
        contactPerson: ["Dr. Emily Rodriguez"],
        authorshipPosition: ["Lead Researcher"],
        projectDuration: "12 months",
        requiredSkills: [
          "Bacterial isolation and identification",
          "Antibiotic susceptibility testing",
          "Data analysis",
        ],
        supervisor: "Prof. James Mitchell",
      },
      {
        projectTitle:
          "Impact of Sleep Deprivation on Cognitive Performance in Medical Students",
        abstract:
          "An observational study investigating the correlation between sleep patterns and academic performance, focusing on memory retention and clinical reasoning abilities.",
        fieldOfResearch: [
          "Medical Education",
          "Sleep Medicine",
          "Neuroscience",
        ],
        contactPerson: ["Dr. Sarah Johnson", "Dr. Michael Chen"],
        authorshipPosition: ["Co-lead", "Data Manager"],
        projectDuration: "8 months",
        requiredSkills: [
          "Statistical analysis",
          "Sleep assessment tools",
          "Psychological testing",
        ],
        supervisor: "Prof. Linda Patterson",
      },
      {
        projectTitle: "Effectiveness of Virtual Reality in Surgical Training",
        abstract:
          "A randomized controlled trial comparing traditional surgical training methods with VR-based simulation techniques in teaching laparoscopic procedures.",
        fieldOfResearch: ["Surgery", "Medical Education", "Technology"],
        contactPerson: ["Dr. Robert Williams"],
        authorshipPosition: ["Principal Investigator"],
        projectDuration: "18 months",
        requiredSkills: [
          "Surgical expertise",
          "VR technology",
          "Educational assessment",
        ],
        supervisor: "Prof. David Thompson",
      },
      {
        projectTitle: "Cardiovascular Biomarkers in Early Diabetes Detection",
        abstract:
          "Investigation of novel biomarkers that can predict cardiovascular complications in newly diagnosed Type 2 diabetes patients with high sensitivity and specificity.",
        fieldOfResearch: ["Cardiology", "Endocrinology", "Biomarker Research"],
        contactPerson: ["Dr. Priya Sharma"],
        authorshipPosition: ["Lead Researcher"],
        projectDuration: "14 months",
        requiredSkills: [
          "Molecular biology",
          "Biostatistics",
          "Laboratory techniques",
        ],
        supervisor: "Prof. Rajesh Kumar",
      },
      {
        projectTitle:
          "Mental Health Outcomes in Cancer Patients: A Longitudinal Study",
        abstract:
          "A long-term prospective study examining psychological adjustment, quality of life, and mental health disorders in patients undergoing cancer treatment.",
        fieldOfResearch: ["Oncology", "Psychiatry", "Clinical Psychology"],
        contactPerson: ["Dr. Margaret Stewart"],
        authorshipPosition: ["Principal Investigator"],
        projectDuration: "24 months",
        requiredSkills: [
          "Psychological assessment",
          "Patient counseling",
          "Longitudinal data analysis",
        ],
        supervisor: "Prof. Helen Martinez",
      },
      {
        projectTitle:
          "Pharmacogenomics and Drug Response Variability in Hypertension Management",
        abstract:
          "Exploring genetic variations that influence antihypertensive drug efficacy and adverse effects to enable personalized medication selection for better patient outcomes.",
        fieldOfResearch: [
          "Pharmacology",
          "Genetics",
          "Cardiovascular Medicine",
        ],
        contactPerson: ["Dr. Aditya Patel"],
        authorshipPosition: ["Lead Researcher"],
        projectDuration: "10 months",
        requiredSkills: [
          "Genetic sequencing",
          "Pharmacokinetics",
          "Clinical trial management",
        ],
        supervisor: "Prof. Sunita Desai",
      },
      {
        projectTitle: "Environmental Factors and Asthma Exacerbation Rates",
        abstract:
          "An epidemiological investigation of air quality, allergen levels, and climatic factors as predictors of asthma hospitalizations in urban populations.",
        fieldOfResearch: [
          "Pulmonology",
          "Environmental Health",
          "Epidemiology",
        ],
        contactPerson: ["Dr. Thomas Anderson"],
        authorshipPosition: ["Co-lead"],
        projectDuration: "12 months",
        requiredSkills: [
          "Environmental sampling",
          "Epidemiological modeling",
          "Respiratory assessment",
        ],
        supervisor: "Prof. Jennifer Garcia",
      },
      {
        projectTitle:
          "Telehealth Efficacy in Rural Community Care: A Multicenter Trial",
        abstract:
          "Evaluating the effectiveness of telemedicine interventions in providing specialized medical care to underserved rural areas and measuring patient satisfaction and health outcomes.",
        fieldOfResearch: [
          "Healthcare Technology",
          "Public Health",
          "Rural Medicine",
        ],
        contactPerson: ["Dr. Christopher Lee"],
        authorshipPosition: ["Principal Investigator"],
        projectDuration: "15 months",
        requiredSkills: [
          "Telehealth platform management",
          "Outcome measurement",
          "Community health assessment",
        ],
        supervisor: "Prof. Victoria Wong",
      },
    ];

    try {
      for (let i = 0; i < sampleResearch.length; i++) {
        await createResearch({
          ...sampleResearch[i],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
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
          <p className="text-muted-foreground">
            Manage research projects and student/faculty submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSeedData}
            variant="outline"
            className="flex items-center gap-2"
          >
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
              placeholder="Search by project title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
            <div className="text-destructive mb-4">
              ⚠️ Error loading research
            </div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold line-clamp-1">
                          {r.projectTitle}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
                          {r.abstract}
                        </p>
                        <div className="flex gap-2 flex-wrap mt-3 text-xs text-muted-foreground">
                          {(r.fieldOfResearch || []).map((f: string) => (
                            <span
                              key={f}
                              className="bg-muted px-2 py-1 rounded text-xs"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" onClick={() => handleEdit(r)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(r.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
