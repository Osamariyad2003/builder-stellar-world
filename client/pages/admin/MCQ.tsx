import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Trash2, Edit2, HelpCircle } from "lucide-react";
import { MCQForm } from "@/components/admin/MCQForm";
import { useMCQ } from "@/hooks/useMCQ";
import { MCQ } from "@shared/types";

export default function MCQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<MCQ | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    mcqs,
    loading,
    error,
    isOfflineMode,
    connectionStatus,
    createMCQ,
    updateMCQ,
    deleteMCQ,
    clearCache,
    retryConnection,
  } = useMCQ();

  const handleCreate = () => {
    setSelected(null);
    setIsFormOpen(true);
  };

  const handleEdit = (mcq: MCQ) => {
    setSelected(mcq);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete MCQ "${title}"? This cannot be undone.`)) {
      try {
        await deleteMCQ(id);
        alert("MCQ deleted successfully");
      } catch (err) {
        console.error(err);
        alert("Failed to delete MCQ");
      }
    }
  };

  const handleSave = async (data: Partial<MCQ>) => {
    try {
      if (selected?.id) {
        await updateMCQ(selected.id, data);
        alert("MCQ updated successfully");
      } else {
        await createMCQ(data);
        alert("MCQ created successfully");
      }
      setIsFormOpen(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save MCQ");
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm("This will add 3 sample MCQs. Continue?")) {
      return;
    }

    const sampleMCQs = [
      {
        title: "Biology - Cell Structure",
        description: "Multiple choice questions on cell structure and organelles",
        category: "Biology",
        difficulty: "medium" as const,
        timeLimit: 20,
        questions: [
          {
            question: "Which organelle is responsible for producing energy in the cell?",
            options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
            correctAnswer: 1,
            explanation: "Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration.",
            imageUrl: "",
          },
          {
            question: "What is the main function of the cell membrane?",
            options: ["Protein synthesis", "Energy production", "Controlling what enters and exits the cell", "DNA storage"],
            correctAnswer: 2,
            explanation: "The cell membrane is selectively permeable and controls the movement of substances in and out of the cell.",
            imageUrl: "",
          },
          {
            question: "Which of the following is found only in plant cells?",
            options: ["Mitochondria", "Centrosome", "Chloroplast", "Lysosome"],
            correctAnswer: 2,
            explanation: "Chloroplasts are found in plant cells and are responsible for photosynthesis.",
            imageUrl: "",
          },
        ],
      },
      {
        title: "Chemistry - Atomic Structure",
        description: "Questions about atoms, electrons, and periodic table",
        category: "Chemistry",
        difficulty: "medium" as const,
        timeLimit: 25,
        questions: [
          {
            question: "What is the charge of a neutron?",
            options: ["Positive", "Negative", "Neutral", "Variable"],
            correctAnswer: 2,
            explanation: "Neutrons have no electrical charge. They are neutral particles found in the atomic nucleus.",
            imageUrl: "",
          },
          {
            question: "Which element has the atomic number 6?",
            options: ["Nitrogen", "Carbon", "Oxygen", "Boron"],
            correctAnswer: 1,
            explanation: "Carbon has 6 protons in its nucleus, giving it atomic number 6.",
            imageUrl: "",
          },
          {
            question: "What is the maximum number of electrons in the first shell of an atom?",
            options: ["2", "4", "8", "10"],
            correctAnswer: 0,
            explanation: "The first electron shell (n=1) can hold a maximum of 2 electrons.",
            imageUrl: "",
          },
        ],
      },
      {
        title: "Physics - Motion and Forces",
        description: "Fundamental concepts of motion, velocity, and Newton's laws",
        category: "Physics",
        difficulty: "hard" as const,
        timeLimit: 30,
        questions: [
          {
            question: "Which of Newton's laws states that for every action, there is an equal and opposite reaction?",
            options: ["First Law", "Second Law", "Third Law", "Fourth Law"],
            correctAnswer: 2,
            explanation: "Newton's Third Law of Motion states that forces always act in pairs - action and reaction.",
            imageUrl: "",
          },
          {
            question: "What is the SI unit of acceleration?",
            options: ["meters per second (m/s)", "meters per second squared (m/s²)", "kilograms (kg)", "newtons (N)"],
            correctAnswer: 1,
            explanation: "Acceleration is the rate of change of velocity, measured in meters per second squared (m/s²).",
            imageUrl: "",
          },
          {
            question: "An object moving at constant velocity has what type of acceleration?",
            options: ["Positive acceleration", "Negative acceleration", "Zero acceleration", "Angular acceleration"],
            correctAnswer: 2,
            explanation: "An object moving at constant velocity has zero acceleration because its velocity is not changing.",
            imageUrl: "",
          },
        ],
      },
    ];

    try {
      for (let i = 0; i < sampleMCQs.length; i++) {
        await createMCQ({
          ...sampleMCQs[i],
          createdAt: new Date(),
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      alert("✅ Successfully added 3 sample MCQs!");
    } catch (err) {
      console.error("Error seeding MCQ data:", err);
      alert("Failed to seed data. Please try again.");
    }
  };

  const filtered = mcqs.filter(
    (mcq) =>
      mcq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mcq.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mcq.difficulty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isFormOpen) {
    return (
      <MCQForm
        mcq={selected}
        onClose={() => {
          setIsFormOpen(false);
          setSelected(null);
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Multiple Choice Questions (MCQ)</h1>
          <p className="text-muted-foreground">Create and manage MCQs for your courses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearCache();
              alert("Cache cleared. Data will be refreshed from server.");
            }}
            title="Clear cached data"
          >
            🔄 Refresh Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedData}
            title="Add sample MCQs"
          >
            📝 Add Sample Data
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create MCQ
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus === "offline" && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-orange-600 rounded-full animate-pulse" />
                <span className="text-orange-800 font-medium">Offline Mode - Changes are cached locally</span>
              </div>
              <Button onClick={retryConnection} size="sm" variant="outline">
                Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading MCQs...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-12">
            <div className="text-red-600 font-medium mb-2">⚠️ Error loading MCQs</div>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={retryConnection} variant="outline" size="sm">
                Retry Connection
              </Button>
              <Button
                onClick={() => window.location.replace(window.location.href)}
                variant="ghost"
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      {!loading && !error && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, category, or difficulty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* MCQ List */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {mcqs.length === 0 ? "No MCQs found" : "No MCQs match your search"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {mcqs.length === 0
                    ? "Start by creating your first MCQ."
                    : "Try adjusting your search terms."}
                </p>
                {mcqs.length === 0 && (
                  <Button onClick={handleCreate}>Create First MCQ</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((mcq) => (
                <Card key={mcq.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <HelpCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="line-clamp-2">{mcq.title}</CardTitle>
                          {mcq.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {mcq.description}
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap mt-3">
                            {mcq.category && (
                              <Badge variant="secondary">{mcq.category}</Badge>
                            )}
                            <Badge className={getDifficultyColor(mcq.difficulty)}>
                              {mcq.difficulty || "medium"}
                            </Badge>
                            <Badge variant="outline">
                              {mcq.timeLimit} mins
                            </Badge>
                            <Badge variant="outline">
                              {mcq.questions?.length || 0} questions
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mcq)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            handleDelete(mcq.id || "", mcq.title)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
