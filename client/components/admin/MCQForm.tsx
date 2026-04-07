import React, { useState, useEffect, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  X,
  Edit2,
  Trash2,
  Upload,
} from "lucide-react";
import { MCQ, MCQQuestion } from "@shared/types";

export type MCQSubjectOption = {
  id: string;
  name: string;
  /** Curriculum year (1–6) for this subject’s parent year. */
  yearNumber: number;
};
import {
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";

interface MCQFormProps {
  mcq?: MCQ | null;
  /** Subjects from Years, each tagged with academic year 1–6 */
  subjects?: MCQSubjectOption[];
  onClose: () => void;
  onSave: (data: Partial<MCQ>) => void;
}

const ACADEMIC_YEAR_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

const normalizeYearNumber = (n: unknown): number => {
  if (typeof n === "number" && n >= 1 && n <= 6 && Number.isFinite(n)) {
    return Math.trunc(n);
  }
  return 1;
};

export function MCQForm({ mcq, subjects, onClose, onSave }: MCQFormProps) {
  const showSubjectSelect = Boolean(subjects && subjects.length > 0);
  const [selectedYearNumber, setSelectedYearNumber] = useState<number>(() =>
    normalizeYearNumber(mcq?.yearNumber),
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(mcq?.subjectId || "");
  const [formData, setFormData] = useState({
    title: mcq?.title || "",
    description: mcq?.description || "",
    category: mcq?.category || "",
    difficulty: (mcq?.difficulty || "medium") as "easy" | "medium" | "hard",
    timeLimit: mcq?.timeLimit ?? 30,
    questions: (mcq?.questions || []) as MCQQuestion[],
  });

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<MCQQuestion>({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    imageUrl: "",
  });

  const subjectsForYear = useMemo(
    () =>
      (subjects || []).filter(
        (s) => s.yearNumber === selectedYearNumber,
      ),
    [subjects, selectedYearNumber],
  );

  useEffect(() => {
    if (mcq) {
      let yr = normalizeYearNumber(mcq.yearNumber);
      if (
        (!mcq.yearNumber || mcq.yearNumber < 1 || mcq.yearNumber > 6) &&
        mcq.subjectId &&
        subjects?.length
      ) {
        const sub = subjects.find((s) => s.id === mcq.subjectId);
        if (sub && sub.yearNumber >= 1 && sub.yearNumber <= 6) {
          yr = sub.yearNumber;
        }
      }
      setSelectedYearNumber(yr);
      setSelectedSubjectId(mcq.subjectId || "");
      setFormData({
        title: mcq.title || "",
        description: mcq.description || "",
        category: mcq.category || "",
        difficulty: mcq.difficulty || "medium",
        timeLimit: mcq.timeLimit || 30,
        questions: mcq.questions || [],
      });
    }
  }, [mcq, subjects]);

  useEffect(() => {
    if (!subjects?.length) return;
    const ok = subjectsForYear.some((s) => s.id === selectedSubjectId);
    if (selectedSubjectId && !ok) {
      setSelectedSubjectId("");
    }
  }, [selectedYearNumber, subjects, subjectsForYear, selectedSubjectId]);

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert("Please enter a question");
      return;
    }

    if (currentQuestion.options.some((opt) => !opt.trim())) {
      alert("Please fill all options");
      return;
    }

    if (editingQuestionIndex !== null) {
      const updated = [...formData.questions];
      updated[editingQuestionIndex] = currentQuestion;
      setFormData((prev) => ({ ...prev, questions: updated }));
      setEditingQuestionIndex(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, { ...currentQuestion, id: Date.now().toString() }],
      }));
    }

    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      imageUrl: "",
    });
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(formData.questions[index]);
    setEditingQuestionIndex(index);
    setIsAddingQuestion(true);
  };

  const handleDeleteQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter MCQ title");
      return;
    }

    if (formData.questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    if (
      showSubjectSelect &&
      selectedSubjectId &&
      !subjectsForYear.some((s) => s.id === selectedSubjectId)
    ) {
      alert("Selected subject does not belong to the chosen academic year.");
      return;
    }

    const payload: Partial<MCQ> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      timeLimit: formData.timeLimit,
      questions: formData.questions,
      yearNumber: selectedYearNumber,
      updatedAt: new Date(),
      ...(showSubjectSelect ? { subjectId: selectedSubjectId || undefined } : {}),
      ...(mcq ? {} : { createdAt: new Date() }),
    };

    onSave(payload);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let imageUrl: string | null = null;
      try {
        imageUrl = await uploadImageToCloudinary(file);
      } catch (cloudErr: any) {
        imageUrl = await uploadToImageKitServer(file, file.name);
      }

      if (imageUrl) {
        onSuccess(imageUrl);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image");
    }
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
            <h1 className="text-2xl font-bold">{mcq ? "Edit MCQ" : "Create MCQ"}</h1>
            <p className="text-muted-foreground">Manage multiple choice questions</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Title, description, and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mcq-academic-year">Academic year *</Label>
              <select
                id="mcq-academic-year"
                value={selectedYearNumber}
                onChange={(e) =>
                  setSelectedYearNumber(
                    normalizeYearNumber(parseInt(e.target.value, 10)),
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Academic year from 1 to 6"
              >
                {ACADEMIC_YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                This value is saved to Firebase as `yearNumber`.
              </p>
            </div>
            {showSubjectSelect && (
              <div>
                <Label htmlFor="mcq-subject">Subject</Label>
                <select
                  id="mcq-subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Select subject for this MCQ"
                >
                  <option value="">No subject</option>
                  {subjectsForYear.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {subjectsForYear.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
                    No subjects for Year {selectedYearNumber}. Add subjects on
                    the Years page for this year.
                  </p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="title">MCQ Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Biology Chapter 1 - Cell Structure"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the MCQ"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Biology"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value as "easy" | "medium" | "hard",
                    }))
                  }
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={formData.timeLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeLimit: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions ({formData.questions.length})</CardTitle>
                <CardDescription>Add and manage MCQ questions</CardDescription>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setCurrentQuestion({
                    question: "",
                    options: ["", "", "", ""],
                    correctAnswer: 0,
                    explanation: "",
                    imageUrl: "",
                  });
                  setEditingQuestionIndex(null);
                  setIsAddingQuestion(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No questions added yet. Add your first question above.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Q{idx + 1}: {q.question}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Correct Answer: {String.fromCharCode(65 + q.correctAnswer)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(idx)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteQuestion(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap text-xs">
                      {q.options.map((opt, i) => (
                        <Badge
                          key={i}
                          variant={i === q.correctAnswer ? "default" : "secondary"}
                        >
                          {String.fromCharCode(65 + i)}: {opt}
                        </Badge>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="text-xs text-muted-foreground mt-2 italic">
                        Explanation: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {mcq ? "Update MCQ" : "Create MCQ"}
          </Button>
        </div>
      </form>

      {/* Question Editor Dialog */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionIndex !== null ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <Label htmlFor="question-text">Question *</Label>
              <Textarea
                id="question-text"
                placeholder="Enter the question..."
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    question: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Question Image */}
            <div>
              <Label>Question Image (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL or click upload"
                  value={currentQuestion.imageUrl}
                  onChange={(e) =>
                    setCurrentQuestion((prev) => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async () => {
                      await handleImageUpload(
                        { target: { files: input.files } } as any,
                        (url) =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            imageUrl: url,
                          }))
                      );
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Answer Options */}
            <div>
              <Label>Answer Options *</Label>
              <div className="space-y-2">
                {currentQuestion.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-8 font-bold text-sm">
                      {String.fromCharCode(65 + i)}:
                    </div>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[i] = e.target.value;
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          options: newOptions,
                        }));
                      }}
                    />
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={currentQuestion.correctAnswer === i}
                      onChange={() =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          correctAnswer: i,
                        }))
                      }
                      title="Mark as correct answer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                placeholder="Explanation for the correct answer..."
                value={currentQuestion.explanation}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    explanation: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddingQuestion(false);
                setEditingQuestionIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddQuestion}>
              {editingQuestionIndex !== null ? "Update Question" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
