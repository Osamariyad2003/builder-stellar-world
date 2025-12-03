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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  HelpCircle,
  Trash2,
  Clock,
  Target,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import {
  uploadImageToCloudinary,
  setLocalCloudinaryConfig,
} from "@/lib/cloudinary";
import { uploadToImageKitServer } from "@/lib/imagekit";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  imageUrl?: string;
  explanation?: {
    text: string;
    imageUrl?: string;
  };
}

interface Quiz {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  passingScore?: number;
  createdAt: Date;
  createdBy: string;
}

interface QuizFormProps {
  quiz?: Quiz | null;
  onClose: () => void;
  onSave: (quiz: Partial<Quiz>) => void;
}

export function QuizForm({ quiz, onClose, onSave }: QuizFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeLimit: 30,
    passingScore: 70,
    questions: [] as QuizQuestion[],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    imageUrl: "",
    weight: 1,
    explanation: {
      text: "",
      imageUrl: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [uploadingExplanationImage, setUploadingExplanationImage] = useState(false);

  useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title || "",
        description: quiz.description || "",
        timeLimit: quiz.timeLimit || 30,
        passingScore: quiz.passingScore || 70,
        questions: (quiz.questions || []).map((q) => ({
          ...q,
          explanation: q.explanation || { text: "", imageUrl: "" },
        })),
        type: (quiz as any).type || "multiple_choice",
      });
    }
  }, [quiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quizData: Partial<Quiz> = {
        ...formData,
        ...(quiz
          ? {}
          : {
              createdAt: new Date(),
              createdBy: "Current User",
            }),
      };

      // Ensure type is present
      if (!(quizData as any).type) (quizData as any).type = "multiple_choice";

      onSave(quizData);
    } catch (error) {
      console.error("Error saving quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const isFlash = (formData as any).type === "flashcard";
    const hasQuestion = currentQuestion.question.trim();
    if (isFlash) {
      const hasAnswer =
        (currentQuestion.options &&
          String(currentQuestion.options[0]).trim()) ||
        (currentQuestion as any).answer;
      if (hasQuestion && hasAnswer) {
        const q = {
          ...currentQuestion,
          options: [
            String(
              currentQuestion.options?.[0] ||
                (currentQuestion as any).answer ||
                "",
            ).trim(),
          ],
          correctAnswer: 0,
        };
        setFormData((prev) => ({ ...prev, questions: [...prev.questions, q] }));
        setCurrentQuestion({
          question: "",
          options: [""],
          correctAnswer: 0,
          imageUrl: "",
          weight: 1,
          explanation: {
            text: "",
            imageUrl: "",
          },
        });
      }
      return;
    }

    if (
      hasQuestion &&
      Array.isArray(currentQuestion.options) &&
      currentQuestion.options.filter((opt) => String(opt).trim()).length >= 2 &&
      typeof currentQuestion.correctAnswer === "number" &&
      String(
        currentQuestion.options[currentQuestion.correctAnswer] || "",
      ).trim()
    ) {
      setFormData((prev) => ({
        ...prev,
        questions: [...prev.questions, { ...currentQuestion }],
      }));
      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        imageUrl: "",
        weight: 1,
        explanation: {
          text: "",
          imageUrl: "",
        },
      });
    }
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  const addOptionField = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  };

  const removeOptionField = (index: number) => {
    setCurrentQuestion((prev) => {
      const opts = [...(prev.options || [])];
      opts.splice(index, 1);
      let correct = prev.correctAnswer;
      if (correct >= opts.length) correct = Math.max(0, opts.length - 1);
      return { ...prev, options: opts, correctAnswer: correct } as any;
    });
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
            <h1 className="text-2xl font-bold">
              {quiz ? "Edit Quiz" : "Create Quiz"}
            </h1>
            <p className="text-muted-foreground">
              {quiz
                ? "Update the quiz details and questions"
                : "Create a new quiz for students"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Quiz Information
            </CardTitle>
            <CardDescription>Basic information about the quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                placeholder="Enter quiz title..."
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
                placeholder="Describe what this quiz covers..."
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeLimit" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Limit (minutes)
                </Label>
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
              <div className="space-y-2">
                <Label
                  htmlFor="passingScore"
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Passing Score (%)
                </Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      passingScore: parseInt(e.target.value) || 70,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizType">Quiz Type</Label>
              <select
                id="quizType"
                value={(formData as any).type || "multiple_choice"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as any,
                  }))
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="flashcard">Flashcard</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Choose how this quiz will be presented to students.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add Question */}
        <Card>
          <CardHeader>
            <CardTitle>Add Question</CardTitle>
            <CardDescription>
              Create multiple choice questions for the quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                placeholder="Enter your question..."
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

            <div className="space-y-2">
              {(formData as any).type === "flashcard" ? (
                <>
                  <Label>Correct Answer</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Correct answer"
                      value={
                        currentQuestion.options[0] ??
                        (currentQuestion as any).answer ??
                        ""
                      }
                      onChange={(e) => {
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          options: [e.target.value],
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      For flashcards enter the correct answer (single). Use
                      [[answer]] in the question to create blanks.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Label>Answer Options</Label>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                            {String.fromCharCode(65 + index)}
                          </Label>
                          <Input
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            value={option}
                            onChange={(e) =>
                              updateQuestionOption(index, e.target.value)
                            }
                            className={
                              currentQuestion.correctAnswer === index
                                ? "ring-2 ring-green-500"
                                : ""
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={
                              currentQuestion.correctAnswer === index
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setCurrentQuestion((prev) => ({
                                ...prev,
                                correctAnswer: index,
                              }))
                            }
                          >
                            {currentQuestion.correctAnswer === index
                              ? "Correct"
                              : "Mark Correct"}
                          </Button>
                          {currentQuestion.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionField(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addOptionField}
                        className="mt-2"
                      >
                        Add Option
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={currentQuestion.imageUrl}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    imageUrl: e.target.value,
                  }))
                }
              />
            </div>

            {/* Explanation Section */}
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Explanation for Correct Answer
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="explanationText">Explanation Text</Label>
                  <Textarea
                    id="explanationText"
                    placeholder="Explain why this answer is correct..."
                    value={(currentQuestion.explanation as any)?.text || ""}
                    onChange={(e) =>
                      setCurrentQuestion((prev) => ({
                        ...prev,
                        explanation: {
                          ...(prev.explanation || {}),
                          text: e.target.value,
                        },
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="explanationImage">Explanation Image (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="explanationImage"
                      placeholder="https://example.com/explanation.jpg"
                      value={(currentQuestion.explanation as any)?.imageUrl || ""}
                      onChange={(e) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          explanation: {
                            ...(prev.explanation || {}),
                            imageUrl: e.target.value,
                          },
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
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingExplanationImage(true);
                          try {
                            let imageUrl =
                              await uploadImageToCloudinary(file);
                            setCurrentQuestion((prev) => ({
                              ...prev,
                              explanation: {
                                ...(prev.explanation || {}),
                                imageUrl: imageUrl,
                              },
                            }));
                          } catch (cloudErr: any) {
                            console.warn(
                              "Cloudinary upload failed, trying ImageKit",
                              cloudErr?.message || cloudErr,
                            );
                            try {
                              const imageUrl =
                                await uploadToImageKitServer(file);
                              setCurrentQuestion((prev) => ({
                                ...prev,
                                explanation: {
                                  ...(prev.explanation || {}),
                                  imageUrl: imageUrl,
                                },
                              }));
                            } catch (err) {
                              console.error(err);
                              alert("Failed to upload image");
                            }
                          } finally {
                            setUploadingExplanationImage(false);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploadingExplanationImage}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingExplanationImage ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  {(currentQuestion.explanation as any)?.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={(currentQuestion.explanation as any).imageUrl}
                        alt="Explanation preview"
                        className="max-h-32 rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Question Weight</Label>
              <Input
                id="weight"
                type="number"
                min={1}
                value={(currentQuestion as any).weight}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    weight: parseFloat(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <Button type="button" onClick={addQuestion} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>

        {/* Questions List */}
        {formData.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Quiz Questions ({formData.questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.questions.map((question, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">
                            {index + 1}. {question.question}
                          </p>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Weight</Label>
                            <Input
                              type="number"
                              min={1}
                              value={(question as any).weight || 1}
                              onChange={(e) => {
                                const w = parseFloat(e.target.value) || 1;
                                setFormData((prev) => ({
                                  ...prev,
                                  questions: prev.questions.map((q, i) =>
                                    i === index
                                      ? ({ ...(q as any), weight: w } as any)
                                      : q,
                                  ),
                                }));
                              }}
                              className="w-20 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-2 p-2 rounded ${
                                question.correctAnswer === optIndex
                                  ? "bg-green-100 text-green-800"
                                  : "bg-secondary/50"
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className="text-sm">{option}</span>
                              {question.correctAnswer === optIndex && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-xs bg-green-200"
                                >
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>

                        {question.explanation?.text && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Explanation
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {question.explanation.text}
                              </p>
                              {question.explanation.imageUrl && (
                                <img
                                  src={question.explanation.imageUrl}
                                  alt="Explanation"
                                  className="max-h-40 rounded border"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || formData.questions.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : quiz ? "Update Quiz" : "Create Quiz"}
          </Button>
        </div>
      </form>
    </div>
  );
}
