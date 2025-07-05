import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuizForm } from "@/components/admin/QuizForm";
import {
  BookOpen,
  Plus,
  Search,
  PlayCircle,
  FileText,
  HelpCircle,
  Edit2,
  Trash2,
  Clock,
  Users,
  Calendar,
  GraduationCap,
  Stethoscope,
  Download,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  lectures: Lecture[];
}

interface Lecture {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  files: FileResource[];
  quizzes: Quiz[];
}

interface Video {
  id: string;
  title: string;
  url: string;
  duration?: string;
}

interface FileResource {
  id: string;
  title: string;
  url: string;
  type: string;
  size?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: number;
  duration: number;
  passingScore: number;
}

// Mock data structure
const yearsData = {
  basic: [
    {
      year: 1,
      subjects: [
        {
          id: "anat-1",
          name: "Anatomy & Embryology",
          lectures: [
            {
              id: "lec-1",
              title: "Introduction to Human Anatomy",
              description: "Basic anatomical terminology and body systems",
              videos: [
                {
                  id: "v1",
                  title: "Body Systems Overview",
                  url: "https://youtube.com/watch?v=abc",
                  duration: "45:30",
                },
                {
                  id: "v2",
                  title: "Anatomical Positions",
                  url: "https://youtube.com/watch?v=def",
                  duration: "30:15",
                },
              ],
              files: [
                {
                  id: "f1",
                  title: "Anatomy Atlas.pdf",
                  url: "/files/anatomy-atlas.pdf",
                  type: "PDF",
                  size: "15MB",
                },
                {
                  id: "f2",
                  title: "Study Guide.docx",
                  url: "/files/study-guide.docx",
                  type: "DOCX",
                  size: "2MB",
                },
              ],
              quizzes: [
                {
                  id: "q1",
                  title: "Basic Anatomy Quiz",
                  questions: 20,
                  duration: 30,
                  passingScore: 75,
                },
              ],
            },
            {
              id: "lec-2",
              title: "Musculoskeletal System",
              description: "Bones, joints, and muscles",
              videos: [
                {
                  id: "v3",
                  title: "Bone Structure",
                  url: "https://youtube.com/watch?v=ghi",
                  duration: "55:20",
                },
              ],
              files: [
                {
                  id: "f3",
                  title: "Bone Diagrams.pdf",
                  url: "/files/bones.pdf",
                  type: "PDF",
                  size: "8MB",
                },
              ],
              quizzes: [
                {
                  id: "q2",
                  title: "Skeletal System Quiz",
                  questions: 15,
                  duration: 25,
                  passingScore: 70,
                },
              ],
            },
          ],
        },
        {
          id: "phys-1",
          name: "Physiology",
          lectures: [
            {
              id: "lec-3",
              title: "Cell Physiology",
              description: "Basic cellular functions and processes",
              videos: [
                {
                  id: "v4",
                  title: "Cell Membrane Function",
                  url: "https://youtube.com/watch?v=jkl",
                  duration: "40:00",
                },
              ],
              files: [
                {
                  id: "f4",
                  title: "Cell Biology Notes.pdf",
                  url: "/files/cell-bio.pdf",
                  type: "PDF",
                  size: "5MB",
                },
              ],
              quizzes: [
                {
                  id: "q3",
                  title: "Cell Function Quiz",
                  questions: 12,
                  duration: 20,
                  passingScore: 75,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      year: 2,
      subjects: [
        {
          id: "path-2",
          name: "Pathology",
          lectures: [
            {
              id: "lec-4",
              title: "General Pathology",
              description: "Introduction to disease processes",
              videos: [
                {
                  id: "v5",
                  title: "Inflammation Process",
                  url: "https://youtube.com/watch?v=mno",
                  duration: "50:15",
                },
              ],
              files: [
                {
                  id: "f5",
                  title: "Pathology Handbook.pdf",
                  url: "/files/pathology.pdf",
                  type: "PDF",
                  size: "12MB",
                },
              ],
              quizzes: [
                {
                  id: "q4",
                  title: "Pathology Basics",
                  questions: 25,
                  duration: 40,
                  passingScore: 80,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      year: 3,
      subjects: [
        {
          id: "pharm-3",
          name: "Pharmacology",
          lectures: [
            {
              id: "lec-5",
              title: "Drug Mechanisms",
              description: "How drugs work in the body",
              videos: [
                {
                  id: "v6",
                  title: "Pharmacokinetics",
                  url: "https://youtube.com/watch?v=pqr",
                  duration: "60:00",
                },
              ],
              files: [
                {
                  id: "f6",
                  title: "Drug Reference.pdf",
                  url: "/files/drugs.pdf",
                  type: "PDF",
                  size: "20MB",
                },
              ],
              quizzes: [
                {
                  id: "q5",
                  title: "Pharmacology Quiz",
                  questions: 30,
                  duration: 45,
                  passingScore: 85,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  clinical: [
    {
      year: 4,
      subjects: [
        {
          id: "int-med-4",
          name: "Internal Medicine",
          lectures: [
            {
              id: "lec-6",
              title: "Cardiovascular Diseases",
              description: "Heart and vascular disorders",
              videos: [
                {
                  id: "v7",
                  title: "Heart Failure Management",
                  url: "https://youtube.com/watch?v=stu",
                  duration: "75:30",
                },
              ],
              files: [
                {
                  id: "f7",
                  title: "Cardiology Guidelines.pdf",
                  url: "/files/cardiology.pdf",
                  type: "PDF",
                  size: "18MB",
                },
              ],
              quizzes: [
                {
                  id: "q6",
                  title: "Cardiology Assessment",
                  questions: 35,
                  duration: 60,
                  passingScore: 80,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      year: 5,
      subjects: [
        {
          id: "surg-5",
          name: "Surgery",
          lectures: [
            {
              id: "lec-7",
              title: "Surgical Principles",
              description: "Basic surgical techniques and patient care",
              videos: [
                {
                  id: "v8",
                  title: "Suturing Techniques",
                  url: "https://youtube.com/watch?v=vwx",
                  duration: "45:00",
                },
              ],
              files: [
                {
                  id: "f8",
                  title: "Surgical Manual.pdf",
                  url: "/files/surgery.pdf",
                  type: "PDF",
                  size: "25MB",
                },
              ],
              quizzes: [
                {
                  id: "q7",
                  title: "Surgery Fundamentals",
                  questions: 40,
                  duration: 90,
                  passingScore: 85,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      year: 6,
      subjects: [
        {
          id: "clin-rot-6",
          name: "Clinical Rotations",
          lectures: [
            {
              id: "lec-8",
              title: "Emergency Medicine",
              description: "Emergency care and trauma management",
              videos: [
                {
                  id: "v9",
                  title: "Trauma Assessment",
                  url: "https://youtube.com/watch?v=yz1",
                  duration: "90:00",
                },
              ],
              files: [
                {
                  id: "f9",
                  title: "Emergency Protocols.pdf",
                  url: "/files/emergency.pdf",
                  type: "PDF",
                  size: "30MB",
                },
              ],
              quizzes: [
                {
                  id: "q8",
                  title: "Emergency Medicine Quiz",
                  questions: 50,
                  duration: 120,
                  passingScore: 90,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default function Years() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);

  const handleVideoClick = (video: Video) => {
    window.open(video.url, "_blank");
  };

  const handleFileClick = (file: FileResource) => {
    window.open(file.url, "_blank");
  };

  const handleQuizClick = (quiz: Quiz) => {
    alert(
      `Starting Quiz: ${quiz.title}\nQuestions: ${quiz.questions}\nDuration: ${quiz.duration} minutes\nPassing Score: ${quiz.passingScore}%`,
    );
  };

  const handleAddQuiz = (lectureId: string) => {
    setSelectedQuiz(null);
    setIsQuizFormOpen(true);
  };

  if (isQuizFormOpen) {
    return (
      <QuizForm
        quiz={selectedQuiz}
        onClose={() => {
          setIsQuizFormOpen(false);
          setSelectedQuiz(null);
        }}
        onSave={(quizData) => {
          console.log("Save quiz:", quizData);
          setIsQuizFormOpen(false);
          setSelectedQuiz(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Academic Years Management</h1>
          <p className="text-muted-foreground">
            Manage curriculum by academic years, subjects, and lectures
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lectures, subjects, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Basic Years (1-3)
          </TabsTrigger>
          <TabsTrigger value="clinical" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Clinical Years (4-6)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-6">
            {yearsData.basic.map((yearData) => (
              <Card
                key={yearData.year}
                className="border-l-4 border-l-blue-500"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Year {yearData.year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {yearData.subjects.map((subject) => (
                      <AccordionItem
                        key={subject.id}
                        value={subject.id}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {subject.name}
                            </span>
                            <Badge variant="secondary">
                              {subject.lectures.length} lectures
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            {subject.lectures.map((lecture) => (
                              <Card
                                key={lecture.id}
                                className="bg-secondary/20"
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">
                                    {lecture.title}
                                  </CardTitle>
                                  {lecture.description && (
                                    <CardDescription>
                                      {lecture.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <div className="grid gap-6 md:grid-cols-3">
                                    {/* Videos */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <PlayCircle className="h-4 w-4 text-green-600" />
                                          Videos ({lecture.videos.length})
                                        </div>
                                      </div>
                                      {lecture.videos.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.videos.map((video) => (
                                            <button
                                              key={video.id}
                                              onClick={() =>
                                                handleVideoClick(video)
                                              }
                                              className="w-full p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <PlayCircle className="h-4 w-4 text-green-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-green-700">
                                                    {video.title}
                                                  </p>
                                                  {video.duration && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {video.duration}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No videos yet
                                        </p>
                                      )}
                                    </div>

                                    {/* Files */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                          Files ({lecture.files.length})
                                        </div>
                                      </div>
                                      {lecture.files.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.files.map((file) => (
                                            <button
                                              key={file.id}
                                              onClick={() =>
                                                handleFileClick(file)
                                              }
                                              className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-blue-700">
                                                    {file.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {file.type}
                                                    </Badge>
                                                    {file.size && (
                                                      <span>{file.size}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No files yet
                                        </p>
                                      )}
                                    </div>

                                    {/* Quizzes */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <HelpCircle className="h-4 w-4 text-purple-600" />
                                          Quizzes ({lecture.quizzes.length})
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddQuiz(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Quiz
                                        </Button>
                                      </div>
                                      {lecture.quizzes.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.quizzes.map((quiz) => (
                                            <button
                                              key={quiz.id}
                                              onClick={() =>
                                                handleQuizClick(quiz)
                                              }
                                              className="w-full p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4 text-purple-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-purple-700">
                                                    {quiz.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                      {quiz.questions} questions
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.duration}min
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.passingScore}% pass
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No quizzes yet
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <div className="space-y-6">
            {yearsData.clinical.map((yearData) => (
              <Card key={yearData.year} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-red-600" />
                    Year {yearData.year}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="space-y-4">
                    {yearData.subjects.map((subject) => (
                      <AccordionItem
                        key={subject.id}
                        value={subject.id}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {subject.name}
                            </span>
                            <Badge variant="secondary">
                              {subject.lectures.length} lectures
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            {subject.lectures.map((lecture) => (
                              <Card
                                key={lecture.id}
                                className="bg-secondary/20"
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">
                                    {lecture.title}
                                  </CardTitle>
                                  {lecture.description && (
                                    <CardDescription>
                                      {lecture.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent>
                                  <div className="grid gap-6 md:grid-cols-3">
                                    {/* Videos */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <PlayCircle className="h-4 w-4 text-green-600" />
                                          Videos ({lecture.videos.length})
                                        </div>
                                      </div>
                                      {lecture.videos.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.videos.map((video) => (
                                            <button
                                              key={video.id}
                                              onClick={() =>
                                                handleVideoClick(video)
                                              }
                                              className="w-full p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <PlayCircle className="h-4 w-4 text-green-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-green-700">
                                                    {video.title}
                                                  </p>
                                                  {video.duration && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {video.duration}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No videos yet
                                        </p>
                                      )}
                                    </div>

                                    {/* Files */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                          Files ({lecture.files.length})
                                        </div>
                                      </div>
                                      {lecture.files.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.files.map((file) => (
                                            <button
                                              key={file.id}
                                              onClick={() =>
                                                handleFileClick(file)
                                              }
                                              className="w-full p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-blue-700">
                                                    {file.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs"
                                                    >
                                                      {file.type}
                                                    </Badge>
                                                    {file.size && (
                                                      <span>{file.size}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No files yet
                                        </p>
                                      )}
                                    </div>

                                    {/* Quizzes */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <HelpCircle className="h-4 w-4 text-purple-600" />
                                          Quizzes ({lecture.quizzes.length})
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleAddQuiz(lecture.id)
                                          }
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Quiz
                                        </Button>
                                      </div>
                                      {lecture.quizzes.length > 0 ? (
                                        <div className="space-y-2">
                                          {lecture.quizzes.map((quiz) => (
                                            <button
                                              key={quiz.id}
                                              onClick={() =>
                                                handleQuizClick(quiz)
                                              }
                                              className="w-full p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left group"
                                            >
                                              <div className="flex items-center gap-2">
                                                <HelpCircle className="h-4 w-4 text-purple-600" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-purple-700">
                                                    {quiz.title}
                                                  </p>
                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                      {quiz.questions} questions
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.duration}min
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                      {quiz.passingScore}% pass
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          No quizzes yet
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
